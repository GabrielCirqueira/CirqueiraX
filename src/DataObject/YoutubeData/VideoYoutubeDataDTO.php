<?php

declare(strict_types=1);

namespace App\DataObject\YoutubeData;

final readonly class VideoYoutubeDataDTO
{
    public function __construct(
        public string $videoId,
        public string $titulo,
        public string $canal,
        public ?string $canalId,
        public ?string $categoriaId,
        public ?int $duracaoMs,
        public ?string $descricao,
        public ?string $urlCapa,
    ) {
    }
}
