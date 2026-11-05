<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class ItemRankingArtistaDTO
{
    public function __construct(
        private string $nomeArtista,
        private ?string $codigoArtista,
        private int $totalStreams,
        private int $totalMs,
    ) {}

    public function nomeArtista(): string
    {
        return $this->nomeArtista;
    }

    public function codigoArtista(): ?string
    {
        return $this->codigoArtista;
    }

    public function totalStreams(): int
    {
        return $this->totalStreams;
    }

    public function totalMs(): int
    {
        return $this->totalMs;
    }

    public function totalMinutos(): int
    {
        return (int) round($this->totalMs / 60000);
    }
}

