<?php

declare(strict_types=1);

namespace App\Service\IdentificacaoMusica;

use App\DataObject\IdentificacaoMusica\ComponenteIdentificadoDTO;
use App\DataObject\IdentificacaoMusica\ResultadoIdentificacaoDTO;
use App\Entity\MusicaCatalogo;
use App\Entity\VideoYoutube;
use App\Enum\OrigemClassificacao;
use App\Enum\StatusClassificacaoVideo;
use App\Enum\TipoIdentificacaoMusica;
use App\Enum\TipoVersaoMusica;
use App\Service\Musica\NormalizarTextoMusicaService;
use App\Service\Musica\ObterMusicaCatalogoService;

final readonly class AplicarIdentificacaoVideoYoutubeService
{
    public const int LIMITE_CONFIANCA_REVISAO = 70;
    public const int LIMITE_COMPONENTES_MASHUP = 5;
    private const int MINIMO_COMPONENTES_MASHUP = 2;
    private const string ESPACO = ' ';
    private const array MARCAS_DE_MUSICA = [
        'lyrics', 'lyric', 'letra', 'legendado', 'slowed', 'reverb', 'sped up', 'nightcore', 'official video', 'official music video',
        'official audio', 'audio oficial', 'clipe oficial', 'videoclipe', 'remix', 'cover', 'acoustic', 'acustico', '8d', 'visualizer', 'feat', 'ft',
    ];

    public function __construct(
        private ConfirmarMusicaYoutubeService $confirmarMusica,
        private ObterMusicaCatalogoService $obterMusica,
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
        $textoVideo = self::ESPACO.$this->normalizador->normalizar(implode(self::ESPACO, [$video->titulo(), $video->canal(), $video->descricaoResumo() ?? ''])).self::ESPACO;

        foreach ($componentes as $componente) {
            $candidatos = [$this->normalizador->normalizarTitulo($componente->titulo), ...array_map($this->normalizador->normalizar(...), $componente->artistas)];
            foreach ($candidatos as $candidato) {
                if ('' !== $candidato && str_contains($textoVideo, self::ESPACO.$candidato.self::ESPACO)) {
                    return true;
                }
            }
        }

        return false;
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

        $mashup = $this->obterMusica->obterMashup($video->usuario(), $partes, $video->urlCapa());

        return $this->classificar($video, $resultado, StatusClassificacaoVideo::Mashup, $mashup);
    }

    private function obterMusicaConfirmada(VideoYoutube $video, ComponenteIdentificadoDTO $componente, TipoVersaoMusica $versao): ?MusicaCatalogo
    {
        $duracaoOriginal = TipoVersaoMusica::Original === $versao ? $video->duracaoMs() : null;
        $oficial = $this->confirmarMusica->executar($componente, $duracaoOriginal);
        if (null === $oficial) {
            return null;
        }

        return $this->obterMusica->obterMusica(
            $video->usuario(),
            $oficial->titulo,
            $this->escolherArtistas($componente, $oficial->textoArtistas),
            $oficial->album,
            $oficial->urlCapa,
            $oficial->videoId,
        );
    }

    /**
     * @return list<string>
     */
    private function escolherArtistas(ComponenteIdentificadoDTO $componente, string $textoArtistasOficial): array
    {
        $principalIa = $this->normalizador->normalizar($componente->artistas[0] ?? '');
        if ('' !== $principalIa && str_contains($this->normalizador->normalizar($textoArtistasOficial), $principalIa)) {
            return $componente->artistas;
        }

        $oficiais = $this->normalizador->separarArtistas($textoArtistasOficial);

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
