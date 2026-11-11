<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

use App\DataObject\Spotify\Analise\ArtistaAnaliseSpotifyDTO;

final readonly class ItemRankingArtistaDTO
{
    private const int MS_POR_MINUTO = 60000;

    public function __construct(
        private string $nomeArtista,
        private ?string $codigoArtista,
        private int $totalStreams,
        private int $totalMs,
        private ?ArtistaAnaliseSpotifyDTO $analise = null,
    ) {}

    public static function daAnalise(ArtistaAnaliseSpotifyDTO $artista): self
    {
        return new self($artista->nome, $artista->codigoArtista, $artista->streams, $artista->minutos * self::MS_POR_MINUTO, $artista);
    }

    public function analise(): ?ArtistaAnaliseSpotifyDTO
    {
        return $this->analise;
    }

    public function temSpotify(): bool
    {
        return $this->analise?->temSpotify() ?? true;
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

    public function totalMs(): int
    {
        return $this->totalMs;
    }

    public function totalMinutos(): int
    {
        return (int) round($this->totalMs / 60000);
    }
}

