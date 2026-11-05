<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class ResumoIntervaloSpotifyDTO
{
    /**
     * @param array<int, ItemRankingMusicaDTO> $topMusicas
     * @param array<int, ItemRankingArtistaDTO> $topArtistas
     */
    public function __construct(
        private int $totalMinutos,
        private int $totalStreams,
        private ?int $variacaoMinutosPercentual,
        private array $topMusicas,
        private array $topArtistas,
    ) {}

    public function totalMinutos(): int
    {
        return $this->totalMinutos;
    }

    public function totalStreams(): int
    {
        return $this->totalStreams;
    }

    public function variacaoMinutosPercentual(): ?int
    {
        return $this->variacaoMinutosPercentual;
    }

    /**
     * @return array<int, ItemRankingMusicaDTO>
     */
    public function topMusicas(): array
    {
        return $this->topMusicas;
    }

    /**
     * @return array<int, ItemRankingArtistaDTO>
     */
    public function topArtistas(): array
    {
        return $this->topArtistas;
    }
}

