<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class ArtistaSpotifyDTO
{
    /**
     * @param array<int, string> $generos
     */
    public function __construct(
        public string $codigoArtista,
        public string $nome,
        public ?string $urlFoto,
        public array $generos,
        public ?string $urlFotoMedia = null,
        public ?string $urlFotoPequena = null,
        public ?string $urlSpotify = null,
    ) {
    }
}
