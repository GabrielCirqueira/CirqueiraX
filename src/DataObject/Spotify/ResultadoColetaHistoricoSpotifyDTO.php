<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class ResultadoColetaHistoricoSpotifyDTO
{
    public function __construct(
        public int $totalColetadas,
        public int $totalNovas,
        public int $totalDuplicadas,
        public ?int $novoCursorMs,
    ) {
    }

    public function totalColetadas(): int
    {
        return $this->totalColetadas;
    }

    public function totalNovas(): int
    {
        return $this->totalNovas;
    }

    public function totalDuplicadas(): int
    {
        return $this->totalDuplicadas;
    }

    public function novoCursorMs(): ?int
    {
        return $this->novoCursorMs;
    }
}

