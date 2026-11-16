<?php

declare(strict_types=1);

namespace App\Service\IdentificacaoMusica;

use App\DataObject\IdentificacaoMusica\ComponenteIdentificadoDTO;
use App\DataObject\IdentificacaoMusica\ResultadoIdentificacaoDTO;
use App\DataObject\YoutubeMusic\ItemHistoricoYoutubeMusicDTO;
use App\Entity\MusicaCatalogo;
use App\Entity\VideoYoutube;
use App\Enum\OrigemClassificacao;
use App\Enum\StatusClassificacaoVideo;
use App\Enum\TipoIdentificacaoMusica;
use App\Enum\TipoVersaoMusica;
use App\Repository\MusicaCatalogoRepository;
use App\Service\Musica\NormalizarTextoMusicaService;
use App\Service\Musica\ObterMusicaCatalogoService;

final readonly class AplicarIdentificacaoVideoYoutubeService
{
    public const int LIMITE_CONFIANCA_REVISAO = 70;
    public const int LIMITE_COMPONENTES_MASHUP = 5;
    private const int MINIMO_COMPONENTES_MASHUP = 2;
    private const int TAMANHO_MINIMO_TITULO_COMPACTO = 4;
    private const string ESPACO = ' ';
    private const array MARCAS_DE_MUSICA = [
        'lyrics', 'lyric', 'letra', 'legendado', 'slowed', 'reverb', 'sped up', 'nightcore', 'official video', 'official music video',
        'official audio', 'audio oficial', 'clipe oficial', 'videoclipe', 'remix', 'cover', 'acoustic', 'acustico', '8d', 'visualizer', 'feat', 'ft',
    ];

    public function __construct(
        private ConfirmarMusicaYoutubeService $confirmarMusica,
        private ObterMusicaCatalogoService $obterMusica,
        private MusicaCatalogoRepository $musicaRepository,
        private NormalizarTextoMusicaService $normalizador,
    ) {
    }

    public function executar(VideoYoutube $video, ResultadoIdentificacaoDTO $resultado): StatusClassificacaoVideo
    {
        $quantidade = count($resultado->componentes);

        if (TipoIdentificacaoMusica::NaoMusica === $resultado->tipo) {
            return $this->classificar($video, $resultado, $this->pareceMusica($video) ? StatusClassificacaoVideo::Revisar : StatusClassificacaoVideo::NaoMusica, null);
        }

        if (TipoIdentificacaoMusica::Compilacao === $resultado->tipo || $quantidade > self::LIMITE_COMPONENTES_MASHUP) {
            return $this->classificar($video, $resultado, StatusClassificacaoVideo::Compilacao, null);
        }

        if (0 === $quantidade || $resultado->ambiguo || $resultado->confianca < self::LIMITE_CONFIANCA_REVISAO) {
            return $this->classificar($video, $resultado, StatusClassificacaoVideo::Revisar, null);
        }

        if (!$this->isCoerenteComVideo($video, $resultado->componentes)) {
            return $this->classificar($video, $resultado, StatusClassificacaoVideo::Revisar, null);
        }

        if ($quantidade >= self::MINIMO_COMPONENTES_MASHUP) {
            return $this->aplicarMashup($video, $resultado);
        }

        return $this->aplicarMusica($video, $resultado, $resultado->componentes[0]);
    }

    private function pareceMusica(VideoYoutube $video): bool
    {
        if (VideoYoutube::CATEGORIA_MUSICA === $video->categoriaYoutube()) {
            return true;
        }

        $titulo = self::ESPACO.$this->normalizador->normalizar($video->titulo()).self::ESPACO;
        foreach (self::MARCAS_DE_MUSICA as $marca) {
            if (str_contains($titulo, self::ESPACO.$marca.self::ESPACO)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param list<ComponenteIdentificadoDTO> $componentes
     */
    private function isCoerenteComVideo(VideoYoutube $video, array $componentes): bool
    {
        foreach ($componentes as $componente) {
            if ($this->isTituloPresenteNoVideo($video, $componente->titulo)) {
                return true;
            }

            foreach ($componente->artistas as $artista) {
                if ($this->isTituloPresenteNoVideo($video, $artista)) {
                    return true;
                }
            }
        }

        return false;
    }

    private function isTituloPresenteNoVideo(VideoYoutube $video, string $tituloMusica): bool
    {
        $textoBruto = implode(self::ESPACO, [$video->titulo(), $video->descricaoResumo() ?? '']);
        $texto = self::ESPACO.$this->normalizador->normalizar($textoBruto).self::ESPACO;
        $tituloNorm = $this->normalizador->normalizarTitulo($tituloMusica);
        if ('' !== $tituloNorm && str_contains($texto, self::ESPACO.$tituloNorm.self::ESPACO)) {
            return true;
        }

        $tituloCompacto = $this->normalizador->compactarTitulo($tituloMusica);
        if (mb_strlen($tituloCompacto) < self::TAMANHO_MINIMO_TITULO_COMPACTO) {
            return false;
        }

        return str_contains($this->normalizador->compactar($textoBruto), $tituloCompacto);
    }

    private function aplicarMusica(VideoYoutube $video, ResultadoIdentificacaoDTO $resultado, ComponenteIdentificadoDTO $componente): StatusClassificacaoVideo
    {
        $musica = $this->obterMusicaConfirmada($video, $componente, $resultado->versao);
        if (null === $musica) {
            return $this->classificar($video, $resultado, StatusClassificacaoVideo::Revisar, null);
        }

        return $this->classificar($video, $resultado, StatusClassificacaoVideo::Musica, $musica);
    }

    private function aplicarMashup(VideoYoutube $video, ResultadoIdentificacaoDTO $resultado): StatusClassificacaoVideo
    {
        $partes = [];
        foreach ($resultado->componentes as $componente) {
            $musica = [] === $componente->artistas ? null : $this->obterMusicaConfirmada($video, $componente, TipoVersaoMusica::Outro);
            if (null === $musica) {
                return $this->classificar($video, $resultado, StatusClassificacaoVideo::Revisar, null);
            }
            $partes[] = ['componente' => $componente, 'musica' => $musica];
        }

        $mashup = $this->obterMusica->obterMashup($partes, $video->urlCapa());

        return $this->classificar($video, $resultado, StatusClassificacaoVideo::Mashup, $mashup);
    }

    private function obterMusicaConfirmada(VideoYoutube $video, ComponenteIdentificadoDTO $componente, TipoVersaoMusica $versao): ?MusicaCatalogo
    {
        $existente = $this->buscarExistenteNoCatalogo($video, $componente);
        if (null !== $existente) {
            return $existente;
        }

        $duracaoOriginal = TipoVersaoMusica::Original === $versao ? $video->duracaoMs() : null;
        $oficial = $this->confirmarMusica->executar($componente, $duracaoOriginal, $video->canal());
        if (null === $oficial || !$this->isTituloConfirmadoNoVideo($video, $componente, $oficial)) {
            return null;
        }

        return $this->obterMusica->obterMusica($oficial->titulo,
            $this->escolherArtistas($componente, $oficial),
            $oficial->album,
            $oficial->urlCapa,
            $oficial->videoId,
        );
    }

    private function isTituloConfirmadoNoVideo(VideoYoutube $video, ComponenteIdentificadoDTO $componente, ItemHistoricoYoutubeMusicDTO $oficial): bool
    {
        if ($this->isTituloPresenteNoVideo($video, $oficial->titulo)) {
            return true;
        }

        $tituloEsperado = $this->isConfirmacaoInvertida($componente, $oficial)
            ? ($componente->artistas[0] ?? '')
            : $componente->titulo;

        return $this->isTituloPresenteNoVideo($video, $tituloEsperado);
    }

    private function isConfirmacaoInvertida(ComponenteIdentificadoDTO $componente, ItemHistoricoYoutubeMusicDTO $oficial): bool
    {
        $tituloOficialCompacto = $this->normalizador->compactarTitulo($oficial->titulo);
        $artistaPrincipalCompacto = $this->normalizador->compactarTitulo($componente->artistas[0] ?? '');

        return '' !== $artistaPrincipalCompacto && $tituloOficialCompacto === $artistaPrincipalCompacto;
    }

    private function buscarExistenteNoCatalogo(VideoYoutube $video, ComponenteIdentificadoDTO $componente): ?MusicaCatalogo
    {
        $tituloCompacto = $this->normalizador->compactarTitulo($componente->titulo);
        if ($this->isTituloPresenteNoVideo($video, $componente->titulo)) {
            foreach ($componente->artistas as $artista) {
                $direta = $this->musicaRepository->buscarExistentePorTituloEArtistaCompactos($tituloCompacto, $this->normalizador->compactar($artista));
                if (null !== $direta) {
                    return $direta;
                }
            }

            $porCanal = $this->musicaRepository->buscarExistentePorTituloEArtistaCompactos($tituloCompacto, $this->normalizador->compactar($this->normalizador->limparCanal($video->canal())));
            if (null !== $porCanal) {
                return $porCanal;
            }
        }

        $artistaComoArtista = $this->normalizador->compactar($componente->titulo);
        foreach ($componente->artistas as $artistaComoTitulo) {
            if (!$this->isTituloPresenteNoVideo($video, $artistaComoTitulo)) {
                continue;
            }

            $invertida = $this->musicaRepository->buscarExistentePorTituloEArtistaCompactos($this->normalizador->compactarTitulo($artistaComoTitulo), $artistaComoArtista);
            if (null !== $invertida) {
                return $invertida;
            }
        }

        return null;
    }

    /**
     * @return list<string>
     */
    private function escolherArtistas(ComponenteIdentificadoDTO $componente, ItemHistoricoYoutubeMusicDTO $oficial): array
    {
        $oficiais = $this->normalizador->separarArtistas($oficial->textoArtistas);
        if ($this->isConfirmacaoInvertida($componente, $oficial)) {
            return [] === $oficiais ? $this->normalizador->separarArtistas($componente->titulo) : $oficiais;
        }

        $principalIa = $this->normalizador->normalizar($componente->artistas[0] ?? '');
        if ('' !== $principalIa && str_contains($this->normalizador->normalizar($oficial->textoArtistas), $principalIa)) {
            return $componente->artistas;
        }

        return [] === $oficiais ? $componente->artistas : $oficiais;
    }

    private function classificar(VideoYoutube $video, ResultadoIdentificacaoDTO $resultado, StatusClassificacaoVideo $status, ?MusicaCatalogo $musica): StatusClassificacaoVideo
    {
        $video->classificar($status, OrigemClassificacao::Ia, $resultado->confianca, $resultado->versao, $musica, $this->resumirResposta($resultado));

        return $status;
    }

    /**
     * @return array<string, mixed>
     */
    private function resumirResposta(ResultadoIdentificacaoDTO $resultado): array
    {
        $paraArray = static fn (ComponenteIdentificadoDTO $componente): array => ['titulo' => $componente->titulo, 'artistas' => $componente->artistas];

        return [
            'tipo' => $resultado->tipo->value,
            'confianca' => $resultado->confianca,
            'versao' => $resultado->versao->value,
            'ambiguo' => $resultado->ambiguo,
            'componentes' => array_map($paraArray, $resultado->componentes),
            'alternativas' => array_map($paraArray, $resultado->alternativas),
        ];
    }
}
