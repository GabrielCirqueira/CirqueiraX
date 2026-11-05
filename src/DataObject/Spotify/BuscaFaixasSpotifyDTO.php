<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class BuscaFaixasSpotifyDTO
{
    /**
     * @param array<int, FaixaSpotifyDTO> $faixas
     */
    public function __construct(
        public array $faixas,
    ) {
    }
}
