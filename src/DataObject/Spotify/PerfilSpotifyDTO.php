<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class PerfilSpotifyDTO
{
    public function __construct(
        public string $id,
        public string $nomeExibicao,
        public ?string $urlFoto,
    ) {
    }
}
