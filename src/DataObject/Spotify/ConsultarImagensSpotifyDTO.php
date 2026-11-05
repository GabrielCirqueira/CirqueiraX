<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class ConsultarImagensSpotifyDTO
{
    /**
     * @param array<int, string> $chaves
     */
    public function __construct(
        public array $chaves = [],
    ) {
    }
}

