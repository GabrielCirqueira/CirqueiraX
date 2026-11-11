<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

use App\DataObject\Spotify\Analise\ArtistaAnaliseSpotifyDTO;

final readonly class ItemRankingArtistaCapsulaDTO
{
    public function __construct(
        private int $posicao,
        private string $nomeArtista,
        private ?string $codigoArtista,
        private int $totalStreams,
        private int $totalMinutos,
        private ?int $movimento,
        private bool $isEstreia,
        private ?string $urlSpotify = null,
        private ?ArtistaAnaliseSpotifyDTO $analise = null,
    ) {}

    public function analise(): ?ArtistaAnaliseSpotifyDTO
    {
        return $this->analise;
    }

    public function temSpotify(): bool
    {
        return $this->analise?->temSpotify() ?? true;
    }

    public function posicao(): int
    {
        return $this->posicao;
    }

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

    public function totalMinutos(): int
    {
        return $this->totalMinutos;
    }

    public function movimento(): ?int
    {
        return $this->movimento;
    }

    public function isEstreia(): bool
    {
        return $this->isEstreia;
    }

    public function urlSpotify(): ?string
    {
        if (null !== $this->urlSpotify) {
            return $this->urlSpotify;
        }

        if (null !== $this->codigoArtista && '' !== trim($this->codigoArtista)) {
            return sprintf('https://open.spotify.com/artist/%s', trim($this->codigoArtista));
        }

        return null;
    }
}

