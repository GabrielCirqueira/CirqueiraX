<?php

declare(strict_types=1);

namespace App\Interface;

use App\DataObject\YoutubeData\ListaVideosYoutubeDataDTO;

interface YoutubeDataInterface
{
    public const int TAMANHO_LOTE = 50;

    /**
     * @param list<string> $videoIds
     */
    public function buscarVideos(array $videoIds): ListaVideosYoutubeDataDTO;
}
