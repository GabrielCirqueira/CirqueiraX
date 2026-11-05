<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class FaixaSpotifyDTO
{
    /**
     * @param array<int, string> $demaisArtistas
     */
    public function __construct(
        public string $codigoFaixa,
        public string $nome,
        public string $artistaPrincipal,
        public ?string $codigoArtistaPrincipal,
        public array $demaisArtistas,
        public string $nomeAlbum,
        public ?string $urlCapa,
        public int $duracaoMs,
        public ?string $urlCapaMedia = null,
        public ?string $urlCapaPequena = null,
        public ?string $urlSpotify = null,
    ) {
    }
}
