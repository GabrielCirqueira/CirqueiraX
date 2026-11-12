<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\DataObject\Spotify\CapsulaMensalSpotifyDTO;
use App\DataObject\Spotify\ItemRankingArtistaCapsulaDTO;
use App\DataObject\Spotify\ItemRankingMusicaCapsulaDTO;
use App\DataObject\Spotify\Analise\ArtistaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\MusicaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\DataObject\Spotify\ItemRankingArtistaDTO;
use App\DataObject\Spotify\ItemRankingMusicaDTO;
use App\DataObject\Spotify\PeriodoMesSpotifyDTO;
use App\DataObject\Spotify\TotaisMesDTO;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Repository\AnaliseReproducaoMusicalRepository;

final readonly class CalcularCapsulaMensalService
{
    private const int LIMITE_TOP_MUSICAS = 5;
    private const int LIMITE_TOP_ARTISTAS = 10;
    private const int LIMITE_TOP_ALBUNS = 5;
    private const int MESES_RETROATIVOS_TOP5 = 6;
    private const int LIMITE_COMPARACAO = 50;

    public function __construct(
        private AnaliseReproducaoMusicalRepository $analiseRepository,
    ) {}

    public function executar(Usuario $usuario, FiltroFonteMusica $fonte, int $ano, int $mes): CapsulaMensalSpotifyDTO
    {
        $periodo = PeriodoMesSpotifyDTO::criar($ano, $mes);
        $periodoAnterior = $periodo->mesAnterior();

        $totaisMes = $this->calcularTotaisMes($usuario, $fonte, $periodo);
        $totaisMesAnterior = $this->calcularTotaisMes($usuario, $fonte, $periodoAnterior);

        $variacaoFaixasPercentual = null;
        if ($totaisMesAnterior->faixasDistintas() > 0) {
            $diferenca = $totaisMes->faixasDistintas() - $totaisMesAnterior->faixasDistintas();
            $variacaoFaixasPercentual = (int) round(($diferenca / $totaisMesAnterior->faixasDistintas()) * 100);
        }

        $rankingMusicas = $this->rankingMusicas($usuario, $fonte, $periodo, self::LIMITE_TOP_MUSICAS);

        $rankingMusicasAnterior = $this->rankingMusicas($usuario, $fonte, $periodoAnterior, self::LIMITE_COMPARACAO);

        /** @var array<string, int> $posicoesMusicasAnterior */
        $posicoesMusicasAnterior = [];
        foreach ($rankingMusicasAnterior as $indice => $item) {
            $posicoesMusicasAnterior[$item->chaveIdentificacao()] = $indice + 1;
        }

        /** @var array<string, int> $historicoTop5Meses */
        $historicoTop5Meses = $this->calcularMesesNoTop5($usuario, $fonte, $periodo, $rankingMusicas);

        $topMusicasCapsula = [];
        foreach ($rankingMusicas as $indice => $musica) {
            $posicaoAtual = $indice + 1;
            $chave = $musica->chaveIdentificacao();
            $posicaoAnterior = $posicoesMusicasAnterior[$chave] ?? null;

            $isEstreia = null === $posicaoAnterior;
            $movimento = null !== $posicaoAnterior ? ($posicaoAnterior - $posicaoAtual) : null;
            $mesesNoTop5 = $historicoTop5Meses[$chave] ?? 1;

            $topMusicasCapsula[] = new ItemRankingMusicaCapsulaDTO(
                posicao: $posicaoAtual,
                codigoFaixa: $musica->codigoFaixa(),
                nomeFaixa: $musica->nomeFaixa(),
                artistaPrincipal: $musica->artistaPrincipal(),
                album: $musica->album(),
                totalStreams: $musica->totalStreams(),
                totalMinutos: $musica->totalMinutos(),
                movimento: $movimento,
                isEstreia: $isEstreia,
                mesesNoTop5: $mesesNoTop5,
                analise: $musica->analise(),
            );
        }

        $rankingArtistas = $this->rankingArtistas($usuario, $fonte, $periodo, self::LIMITE_TOP_ARTISTAS);

        $rankingArtistasAnterior = $this->rankingArtistas($usuario, $fonte, $periodoAnterior, self::LIMITE_COMPARACAO);

        /** @var array<string, int> $posicoesArtistasAnterior */
        $posicoesArtistasAnterior = [];
        foreach ($rankingArtistasAnterior as $indice => $item) {
            $posicoesArtistasAnterior[mb_strtolower($item->nomeArtista())] = $indice + 1;
        }

        $topArtistasCapsula = [];
        foreach ($rankingArtistas as $indice => $artista) {
            $posicaoAtual = $indice + 1;
            $chaveArtista = mb_strtolower($artista->nomeArtista());
            $posicaoAnterior = $posicoesArtistasAnterior[$chaveArtista] ?? null;

            $isEstreia = null === $posicaoAnterior;
            $movimento = null !== $posicaoAnterior ? ($posicaoAnterior - $posicaoAtual) : null;

            $topArtistasCapsula[] = new ItemRankingArtistaCapsulaDTO(
                posicao: $posicaoAtual,
                nomeArtista: $artista->nomeArtista(),
                codigoArtista: $artista->codigoArtista(),
                totalStreams: $artista->totalStreams(),
                totalMinutos: $artista->totalMinutos(),
                movimento: $movimento,
                isEstreia: $isEstreia,
                analise: $artista->analise(),
            );
        }

        $minutosPorDia = $this->analiseRepository->calcularMinutosPorDia($usuario, $periodo, $fonte);

        $musicaMaisOuvida = $topMusicasCapsula[0] ?? null;
        $artistaMaisOuvido = $topArtistasCapsula[0] ?? null;

        $mesesNomes = [
            1 => 'Janeiro', 2 => 'Fevereiro', 3 => 'Março', 4 => 'Abril',
            5 => 'Maio', 6 => 'Junho', 7 => 'Julho', 8 => 'Agosto',
            9 => 'Setembro', 10 => 'Outubro', 11 => 'Novembro', 12 => 'Dezembro',
        ];
        $rotulo = sprintf('%s de %d', $mesesNomes[$mes] ?? (string) $mes, $ano);

        return new CapsulaMensalSpotifyDTO(
            ano: $ano,
            mes: $mes,
            rotulo: $rotulo,
            emAndamento: $periodo->isMesCorrente(),
            calculadoEm: new \DateTimeImmutable(),
            totalMinutos: $totaisMes->totalMinutos(),
            totalStreams: $totaisMes->totalStreams(),
            faixasDistintas: $totaisMes->faixasDistintas(),
            variacaoFaixasDistintasPercentual: $variacaoFaixasPercentual,
            musicaMaisOuvida: $musicaMaisOuvida,
            artistaMaisOuvido: $artistaMaisOuvido,
            topMusicas: $topMusicasCapsula,
            topArtistas: $topArtistasCapsula,
            minutosPorDia: $minutosPorDia,
            topAlbuns: $this->analiseRepository->listarRankingAlbuns($usuario, PeriodoAnaliseSpotifyDTO::doMes($ano, $mes), $fonte, self::LIMITE_TOP_ALBUNS),
        );
    }

    /**
     * @param list<ItemRankingMusicaDTO> $topMusicas
     * @return array<string, int>
     */
    private function calcularMesesNoTop5(
        Usuario $usuario,
        FiltroFonteMusica $fonte,
        PeriodoMesSpotifyDTO $periodoAtual,
        array $topMusicas,
    ): array {
        /** @var array<string, int> $contagem */
        $contagem = [];

        foreach ($topMusicas as $m) {
            $contagem[$m->chaveIdentificacao()] = 1;
        }

        if (empty($contagem)) {
            return [];
        }

        $periodoCursor = $periodoAtual->mesAnterior();

        for ($passo = 1; $passo <= self::MESES_RETROATIVOS_TOP5; $passo++) {
            $rankingMes = $this->rankingMusicas($usuario, $fonte, $periodoCursor, self::LIMITE_TOP_MUSICAS);

            /** @var array<string, true> $noTop5DesteMes */
            $noTop5DesteMes = [];
            foreach ($rankingMes as $item) {
                $noTop5DesteMes[$item->chaveIdentificacao()] = true;
            }

            $algumaPermaneceu = false;
            foreach ($topMusicas as $m) {
                $chave = $m->chaveIdentificacao();
                if (isset($noTop5DesteMes[$chave]) && $contagem[$chave] === $passo) {
                    $contagem[$chave]++;
                    $algumaPermaneceu = true;
                }
            }

            if (!$algumaPermaneceu) {
                break;
            }

            $periodoCursor = $periodoCursor->mesAnterior();
        }

        return $contagem;
    }

    private function calcularTotaisMes(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoMesSpotifyDTO $periodo): TotaisMesDTO
    {
        $totais = $this->analiseRepository->calcularTotais($usuario, PeriodoAnaliseSpotifyDTO::doMes($periodo->ano(), $periodo->mes()), $fonte);

        return new TotaisMesDTO($totais['minutos'], $totais['streams'], $totais['musicas']);
    }

    /**
     * @return list<ItemRankingMusicaDTO>
     */
    private function rankingMusicas(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoMesSpotifyDTO $periodo, int $limite): array
    {
        return array_map(
            static fn (MusicaAnaliseSpotifyDTO $musica): ItemRankingMusicaDTO => ItemRankingMusicaDTO::daAnalise($musica),
            $this->analiseRepository->listarRankingMusicas($usuario, PeriodoAnaliseSpotifyDTO::doMes($periodo->ano(), $periodo->mes()), $fonte, $limite),
        );
    }

    /**
     * @return list<ItemRankingArtistaDTO>
     */
    private function rankingArtistas(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoMesSpotifyDTO $periodo, int $limite): array
    {
        return array_map(
            static fn (ArtistaAnaliseSpotifyDTO $artista): ItemRankingArtistaDTO => ItemRankingArtistaDTO::daAnalise($artista),
            $this->analiseRepository->listarRankingArtistas($usuario, PeriodoAnaliseSpotifyDTO::doMes($periodo->ano(), $periodo->mes()), $fonte, $limite),
        );
    }
}
