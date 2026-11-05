<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class ItemRankingMusicaCapsulaDTO
{
    public function __construct(
        private int $posicao,
        private ?string $codigoFaixa,
        private string $nomeFaixa,
        private string $artistaPrincipal,
        private string $album,
        private int $totalStreams,
        private int $totalMinutos,
        private ?int $movimento,
        private bool $isEstreia,
        private int $mesesNoTop5,
        private ?string $urlSpotify = null,
    ) {}

    public function posicao(): int
    {
        return $this->posicao;
    }

    public function codigoFaixa(): ?string
    {
        return $this->codigoFaixa;
    }

    public function nomeFaixa(): string
    {
        return $this->nomeFaixa;
    }

    public function artistaPrincipal(): string
    {
        return $this->artistaPrincipal;
    }

    public function album(): string
    {
        return $this->album;
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

    public function mesesNoTop5(): int
    {
        return $this->mesesNoTop5;
    }

    public function urlSpotify(): ?string
    {
        if (null !== $this->urlSpotify) {
            return $this->urlSpotify;
        }

        if (null !== $this->codigoFaixa && '' !== trim($this->codigoFaixa)) {
            return sprintf('https://open.spotify.com/track/%s', trim($this->codigoFaixa));
        }

        return null;
    }
}

