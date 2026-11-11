<?php

declare(strict_types=1);

namespace App\DataObject\YoutubeMusic;

final readonly class ContaValidadaYoutubeMusicDTO
{
    public function __construct(
        public ?string $nomeConta,
        public ?string $canal,
    ) {
    }
}
