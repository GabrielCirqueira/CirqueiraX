<?php

declare(strict_types=1);

namespace App\Service\Musica\Projecao;

use App\Entity\Usuario;
use App\Entity\VideoYoutube;
use App\Repository\ReproducaoMusicalRepository;
use App\Service\Spotify\CacheAnaliseSpotifyService;

final readonly class ProjetarReproducoesYoutubeService
{
    public function __construct(
        private ReproducaoMusicalRepository $reproducaoMusicalRepository,
        private CacheAnaliseSpotifyService $cacheAnalise,
    ) {
    }

    /**
     * @param list<VideoYoutube> $videos
     */
    public function projetarVideos(Usuario $usuario, array $videos): int
    {
        if ([] === $videos) {
            return 0;
        }

        $uuids = array_values(array_unique(array_map(static fn (VideoYoutube $video): string => $video->uuid()->toBinary(), $videos)));

        $projetadas = $this->reproducaoMusicalRepository->reprojetarYoutube($usuario, $uuids);
        $this->cacheAnalise->invalidar($usuario);

        return $projetadas;
    }

    public function projetarTudo(Usuario $usuario): int
    {
        $projetadas = $this->reproducaoMusicalRepository->reprojetarYoutube($usuario, null);
        $this->cacheAnalise->invalidar($usuario);

        return $projetadas;
    }
}
