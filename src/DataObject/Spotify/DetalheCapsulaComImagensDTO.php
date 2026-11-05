<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class DetalheCapsulaComImagensDTO
{
    public function __construct(
        private CapsulaMensalSpotifyDTO $capsula,
        private MapaImagensSpotifyDTO $mapaImagens,
    ) {
    }

    public function capsula(): CapsulaMensalSpotifyDTO
    {
        return $this->capsula;
    }

    public function mapaImagens(): MapaImagensSpotifyDTO
    {
        return $this->mapaImagens;
    }
}

