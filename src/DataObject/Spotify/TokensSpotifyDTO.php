<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class TokensSpotifyDTO
{
    public function __construct(
        public string $accessToken,
        public ?string $refreshToken,
        public int $expiraEmSegundos,
        public string $escopos,
    ) {
    }
}
