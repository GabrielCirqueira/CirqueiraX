<?php

declare(strict_types=1);

namespace App\Serializer;

use App\Entity\ArtistaCatalogo;
use App\Entity\ComponenteMashup;
use App\Entity\MusicaCatalogo;
use App\Entity\VideoYoutube;
use DateTimeInterface;

final class MusicaCatalogoSerializer
{
    private const string FORMATO_MINIATURA = 'https://i.ytimg.com/vi/%s/hqdefault.jpg';

    /**
     * @return array<string, mixed>
     */
    public function serializarMusica(MusicaCatalogo $musica): array
    {
        return [
            'uuid' => $musica->uuid()->toRfc4122(),
            'titulo' => $musica->titulo(),
            'tipo' => $musica->tipo()->value,
            'artistas' => array_map(fn (ArtistaCatalogo $artista): array => $this->serializarArtista($artista), $musica->artistas()),
            'album' => $musica->album(),
            'urlCapa' => $musica->urlCapa(),
            'videoOficialId' => $musica->videoOficialId(),
            'confirmadaManualmente' => $musica->confirmadaManualmente(),
            'unidaA' => $musica->unidaA()?->uuid()->toRfc4122(),
            'componentes' => array_map(static fn (ComponenteMashup $componente): array => [
                'texto' => $componente->texto(),
                'musicaUuid' => $componente->musicaComponente()?->uuid()->toRfc4122(),
                'musicaTitulo' => $componente->musicaComponente()?->titulo(),
            ], $musica->componentes()),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function serializarArtista(ArtistaCatalogo $artista): array
    {
        return [
            'uuid' => $artista->uuid()->toRfc4122(),
            'nome' => $artista->nome(),
            'unidoA' => $artista->unidoA()?->uuid()->toRfc4122(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function serializarVideo(VideoYoutube $video): array
    {
        $musica = $video->musica();

        return [
            'uuid' => $video->uuid()->toRfc4122(),
            'videoId' => $video->videoId(),
            'titulo' => $video->titulo(),
            'canal' => $video->canal(),
            'duracaoMs' => $video->duracaoMs(),
            'miniatura' => $video->urlCapa() ?? sprintf(self::FORMATO_MINIATURA, $video->videoId()),
            'disponivel' => $video->disponivel(),
            'status' => $video->status()->value,
            'statusDescricao' => $video->status()->descricao(),
            'origemClassificacao' => $video->origemClassificacao()?->value,
            'confianca' => $video->confianca(),
            'tipoVersao' => $video->tipoVersao()?->value,
            'sugestaoIa' => $video->respostaIa(),
            'classificadoEm' => $video->classificadoEm()?->format(DateTimeInterface::ATOM),
            'musica' => null === $musica ? null : $this->serializarMusica($musica->musicaEfetiva()),
        ];
    }
}
