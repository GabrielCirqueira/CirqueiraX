<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class ResumoComImagensDTO
{
    public function __construct(
        private ResumoGeralSpotifyDTO $resumo,
        private MapaImagensSpotifyDTO $mapaImagens,
    ) {
    }

    public function resumo(): ResumoGeralSpotifyDTO
    {
        return $this->resumo;
    }

    public function mapaImagens(): MapaImagensSpotifyDTO
    {
        return $this->mapaImagens;
    }
}

