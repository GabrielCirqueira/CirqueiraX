<?php

declare(strict_types=1);

namespace App\Service\IdentificacaoMusica;

use App\Entity\VideoYoutube;
use App\Repository\VideoYoutubeRepository;

final readonly class IdentificarPendentesYoutubeService
{
    public const int LIMITE_POR_RODADA = 50;

    public function __construct(
        private VideoYoutubeRepository $videoRepository,
        private IdentificarVideosYoutubeService $identificarVideos,
    ) {
    }

    /**
     * @return array<string, int>
     */
    public function executar(int $limite = self::LIMITE_POR_RODADA): array
    {
        $porUsuario = [];
        foreach ($this->videoRepository->listarPendentesDeTodos($limite) as $video) {
            $porUsuario[(int) $video->usuario()->getId()][] = $video;
        }

        $contagem = [];
        foreach ($porUsuario as $videos) {
            foreach ($this->identificarVideos->executar($videos[0]->usuario(), $videos) as $status => $quantidade) {
                $contagem[$status] = ($contagem[$status] ?? 0) + $quantidade;
            }
        }

        return $contagem;
    }

    /**
     * @param list<VideoYoutube> $videos
     *
     * @return array<string, int>
     */
    public function reidentificar(array $videos): array
    {
        if ([] === $videos) {
            return [];
        }

        return $this->identificarVideos->executar($videos[0]->usuario(), $videos);
    }
}
