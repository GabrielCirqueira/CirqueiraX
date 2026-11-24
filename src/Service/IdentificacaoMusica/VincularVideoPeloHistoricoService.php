<?php

declare(strict_types=1);

namespace App\Service\IdentificacaoMusica;

use App\DataObject\IdentificacaoMusica\HistoricoMusicalDTO;
use App\Entity\Usuario;
use App\Entity\VideoYoutube;
use App\Enum\OrigemClassificacao;
use App\Enum\StatusClassificacaoVideo;
use App\Enum\TipoVersaoMusica;
use App\Repository\MusicaCatalogoRepository;
use App\Service\Musica\NormalizarTextoMusicaService;

final readonly class VincularVideoPeloHistoricoService
{
    private const int CONFIANCA = 95;
    private const int MAXIMO_PALAVRAS_SOBRANDO = 3;
    private const int MAXIMO_PALAVRAS_SOBRANDO_COM_JUNCAO = 1;
    private const string PADRAO_VETO = '/\b(?:reagindo|reagi|reacao|react|reacts|reacting|reaction|analise|analisando|tutorial|aula|como tocar|how to play|karaoke|mashup|medley|megamix)\b/u';
    private const string PADRAO_JUNCAO = '/\b(?:x|vs)\b/u';
    private const int TAMANHO_MINIMO_PALAVRA_SOBRANDO = 3;
    private const int TAMANHO_MINIMO_NOME = 2;
    private const string ESPACO = ' ';
    private const string PADRAO_TRECHO_ENTRE_PARENTESES = '/\s*[\(\[][^\)\]]*[\)\]]/u';
    private const string PADRAO_SUFIXO_APOS_TRACO = '/\s+-\s+.*$/u';
    private const string PADRAO_PALAVRAS_IGNORADAS = '/\b(?:slowed|reverb|reverbed|sped|speed|up|nightcore|8d|lyrics?|letra|legendad[oa]|traducao|tiktok|visuali[sz]er|official|oficial|audio|video|videoclipe|clipe|music|musica|hd|4k|remaster(?:ed)?|remix|edit|version|versao|extended|live|ao|vivo|acoustic|acustic[oa]|instrumental|cover|ultra|super|perfection|perfect|bass|boosted|loop|hour|hours|hora|horas|feat|ft|with|com|part|and|to|the|x|e|de|da|do|o|a)\b/u';
    private const array VERSOES_POR_PADRAO = [
        '/\b(?:sped|speed) up\b/u' => TipoVersaoMusica::SpedUp,
        '/\bnightcore\b/u' => TipoVersaoMusica::Nightcore,
        '/\bslowed\b/u' => TipoVersaoMusica::Slowed,
        '/\b8d\b/u' => TipoVersaoMusica::OitoD,
        '/\breverb(?:ed)?\b/u' => TipoVersaoMusica::Reverb,
        '/\bremix\b/u' => TipoVersaoMusica::Remix,
        '/\bcover\b/u' => TipoVersaoMusica::Cover,
        '/\binstrumental\b/u' => TipoVersaoMusica::Instrumental,
        '/\b(?:live|ao vivo)\b/u' => TipoVersaoMusica::AoVivo,
        '/\b(?:traducao|legendad[oa])\b/u' => TipoVersaoMusica::Traducao,
        '/\b(?:lyrics?|letra)\b/u' => TipoVersaoMusica::Lyrics,
        '/\b(?:official (?:music )?video|clipe oficial|videoclipe)\b/u' => TipoVersaoMusica::VideoOficial,
    ];

    public function __construct(
        private MusicaCatalogoRepository $musicaRepository,
        private NormalizarTextoMusicaService $normalizador,
    ) {
    }

    public function carregarHistorico(Usuario $usuario): HistoricoMusicalDTO
    {
        $porPrimeiraPalavra = [];
        foreach ($this->musicaRepository->listarOuvidasPeloUsuarioComArtistas($usuario) as $musica) {
            $titulo = $this->normalizarTituloDoCatalogo($musica['titulo']);
            $artistas = array_values(array_filter(
                array_map($this->normalizador->normalizar(...), $musica['artistas']),
                static fn (string $artista): bool => mb_strlen($artista) >= self::TAMANHO_MINIMO_NOME,
            ));
            if (mb_strlen($titulo) < self::TAMANHO_MINIMO_NOME || [] === $artistas) {
                continue;
            }

            $primeiraPalavra = explode(self::ESPACO, $titulo)[0];
            $porPrimeiraPalavra[$primeiraPalavra][] = [...$musica, 'titulo' => $titulo, 'artistas' => $artistas];
        }

        return new HistoricoMusicalDTO($porPrimeiraPalavra);
    }

    public function vincular(VideoYoutube $video, HistoricoMusicalDTO $historico): bool
    {
        if ($historico->isVazio() || $video->isClassificadoManualmente()) {
            return false;
        }

        $titulo = $this->normalizador->normalizar($video->titulo());
        $tituloComCanal = $titulo.self::ESPACO.$this->normalizador->normalizar($this->normalizador->limparCanal($video->canal()));
        $encontrada = $this->buscarMusicaNoTitulo($titulo, $tituloComCanal, $historico);
        if (null === $encontrada) {
            return false;
        }

        $sobra = $this->removerTrechos($titulo, [$encontrada['titulo'], ...$encontrada['artistas']]);
        if (!$this->isSobraAceitavel($sobra)) {
            return false;
        }

        $musica = $this->musicaRepository->buscarPorUuid($encontrada['uuid']);
        if (null === $musica) {
            return false;
        }

        $video->classificar(StatusClassificacaoVideo::Musica, OrigemClassificacao::Historico, self::CONFIANCA, $this->detectarVersao($sobra), $musica);

        return true;
    }

    /**
     * @return array{uuid: string, titulo: string, artistas: list<string>, reproducoes: int}|null
     */
    private function buscarMusicaNoTitulo(string $titulo, string $tituloComCanal, HistoricoMusicalDTO $historico): ?array
    {
        $melhor = null;
        $melhorPontuacao = null;
        foreach (array_unique(explode(self::ESPACO, $titulo)) as $palavra) {
            foreach ($historico->candidatasComecandoPor($palavra) as $candidata) {
                if (!$this->contemTrecho($titulo, $candidata['titulo'])) {
                    continue;
                }

                $artista = $this->maiorArtistaPresente($tituloComCanal, $candidata['artistas']);
                if (null === $artista) {
                    continue;
                }

                $pontuacao = [mb_strlen($candidata['titulo']), mb_strlen($artista), $candidata['reproducoes']];
                if (null === $melhorPontuacao || $pontuacao > $melhorPontuacao) {
                    $melhor = $candidata;
                    $melhorPontuacao = $pontuacao;
                }
            }
        }

        return $melhor;
    }

    /**
     * @param list<string> $artistas
     */
    private function maiorArtistaPresente(string $texto, array $artistas): ?string
    {
        $maior = null;
        foreach ($artistas as $artista) {
            if ($this->contemTrecho($texto, $artista) && mb_strlen($artista) > mb_strlen($maior ?? '')) {
                $maior = $artista;
            }
        }

        return $maior;
    }

    private function contemTrecho(string $texto, string $trecho): bool
    {
        return '' !== $trecho && str_contains(self::ESPACO.$texto.self::ESPACO, self::ESPACO.$trecho.self::ESPACO);
    }

    /**
     * @param list<string> $trechos
     */
    private function removerTrechos(string $texto, array $trechos): string
    {
        usort($trechos, static fn (string $a, string $b): int => mb_strlen($b) <=> mb_strlen($a));
        $resultado = self::ESPACO.$texto.self::ESPACO;
        foreach ($trechos as $trecho) {
            if ('' !== $trecho) {
                $resultado = str_replace(self::ESPACO.$trecho.self::ESPACO, self::ESPACO, $resultado);
            }
        }

        return trim($resultado);
    }

    private function isSobraAceitavel(string $sobra): bool
    {
        if (1 === preg_match(self::PADRAO_VETO, $sobra)) {
            return false;
        }

        $limite = 1 === preg_match(self::PADRAO_JUNCAO, $sobra) ? self::MAXIMO_PALAVRAS_SOBRANDO_COM_JUNCAO : self::MAXIMO_PALAVRAS_SOBRANDO;

        return $this->contarPalavrasSobrando($sobra) <= $limite;
    }

    private function contarPalavrasSobrando(string $sobra): int
    {
        $semRotulos = preg_replace(self::PADRAO_PALAVRAS_IGNORADAS, self::ESPACO, $sobra) ?? $sobra;
        $palavras = array_filter(
            explode(self::ESPACO, $semRotulos),
            static fn (string $palavra): bool => mb_strlen($palavra) >= self::TAMANHO_MINIMO_PALAVRA_SOBRANDO && !ctype_digit($palavra),
        );

        return count($palavras);
    }

    private function detectarVersao(string $sobra): TipoVersaoMusica
    {
        foreach (self::VERSOES_POR_PADRAO as $padrao => $versao) {
            if (1 === preg_match($padrao, $sobra)) {
                return $versao;
            }
        }

        return TipoVersaoMusica::Original;
    }

    private function normalizarTituloDoCatalogo(string $titulo): string
    {
        $semParenteses = trim(preg_replace(self::PADRAO_TRECHO_ENTRE_PARENTESES, '', $titulo) ?? $titulo);
        $semSufixo = trim(preg_replace(self::PADRAO_SUFIXO_APOS_TRACO, '', $semParenteses) ?? $semParenteses);

        return $this->normalizador->normalizar('' === $semSufixo ? $titulo : $semSufixo);
    }
}
