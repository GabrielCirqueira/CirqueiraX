<?php

declare(strict_types=1);

namespace App\DataObject\YoutubeMusic;

use DateTimeImmutable;

final readonly class ItemHistoricoTakeoutYoutubeDTO
{
    public function __construct(
        public string $videoId,
        public ?string $titulo,
        public ?string $canal,
        public DateTimeImmutable $tocadaEm,
        public bool $youtubeMusic,
    ) {
    }
}
