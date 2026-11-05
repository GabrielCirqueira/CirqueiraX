<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class ResumoGeralSpotifyDTO
{
    public function __construct(
        private ResumoIntervaloSpotifyDTO $hoje,
        private ResumoIntervaloSpotifyDTO $semana,
        private CuriosidadesSpotifyDTO $curiosidades,
    ) {}

    public function hoje(): ResumoIntervaloSpotifyDTO
    {
        return $this->hoje;
    }

    public function semana(): ResumoIntervaloSpotifyDTO
    {
        return $this->semana;
    }

    public function curiosidades(): CuriosidadesSpotifyDTO
    {
        return $this->curiosidades;
    }
}

