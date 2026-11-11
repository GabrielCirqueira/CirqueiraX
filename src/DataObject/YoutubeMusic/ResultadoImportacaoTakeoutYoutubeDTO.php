<?php

declare(strict_types=1);

namespace App\DataObject\YoutubeMusic;

final readonly class ResultadoImportacaoTakeoutYoutubeDTO
{
    public function __construct(
        public int $totalLidos,
        public int $totalDescartados,
        public int $totalNovos,
        public int $totalIgnorados,
        public int $totalUnificados,
        public int $totalVideosNovos,
    ) {
    }
}
