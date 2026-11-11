<?php

declare(strict_types=1);

namespace App\DataObject\YoutubeData;

final readonly class ListaVideosYoutubeDataDTO
{
    /**
     * @param array<string, VideoYoutubeDataDTO> $videos
     * @param list<string>                       $idsNaoEncontrados
     */
    public function __construct(
        public array $videos,
        public array $idsNaoEncontrados,
        public int $chamadasRealizadas,
    ) {
    }
}
