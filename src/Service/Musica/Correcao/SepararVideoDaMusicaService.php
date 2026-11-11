<?php

declare(strict_types=1);

namespace App\Service\Musica\Correcao;

use App\Entity\Usuario;
use App\Entity\VideoYoutube;
use App\Enum\OrigemClassificacao;
use App\Enum\StatusClassificacaoVideo;
use App\Exception\Musica\MusicaCatalogoException;
use App\Repository\VideoYoutubeRepository;
use App\Service\Musica\Projecao\ProjetarReproducoesYoutubeService;
use App\Service\Spotify\CacheAnaliseSpotifyService;

final readonly class SepararVideoDaMusicaService
{
    public function __construct(
        private VideoYoutubeRepository $videoRepository,
        private CacheAnaliseSpotifyService $cacheAnalise,
        private ProjetarReproducoesYoutubeService $projetarYoutube,
    ) {
    }

    public function executar(Usuario $usuario, string $videoUuid): VideoYoutube
    {
        $video = $this->videoRepository->buscarDoUsuario($usuario, $videoUuid) ?? throw MusicaCatalogoException::videoNaoEncontrado();

        $video->classificar(StatusClassificacaoVideo::Revisar, OrigemClassificacao::Manual, null, $video->tipoVersao(), null);
        $this->videoRepository->flush();
        $this->projetarYoutube->projetarVideos($usuario, [$video]);
        $this->cacheAnalise->invalidar($usuario);

        return $video;
    }
}
