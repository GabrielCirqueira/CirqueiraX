<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

use App\DataObject\Spotify\Analise\MusicaAnaliseSpotifyDTO;

final readonly class ItemRankingMusicaDTO
{
    private const int MS_POR_MINUTO = 60000;

    public function __construct(
        private ?string $codigoFaixa,
        private string $nomeFaixa,
        private string $artistaPrincipal,
        private string $album,
        private int $totalStreams,
        private int $totalMs,
        private \DateTimeImmutable $maisRecenteEm,
        private ?MusicaAnaliseSpotifyDTO $analise = null,
    ) {}

    public static function daAnalise(MusicaAnaliseSpotifyDTO $musica): self
    {
        return new self(
            $musica->codigoFaixa,
            $musica->nomeFaixa,
            $musica->artista,
            $musica->album,
            $musica->streams,
            $musica->minutos * self::MS_POR_MINUTO,
            new \DateTimeImmutable(),
            $musica,
        );
    }

    public function analise(): ?MusicaAnaliseSpotifyDTO
    {
        return $this->analise;
    }

    public function temSpotify(): bool
    {
        return $this->analise?->temSpotify() ?? true;
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

    public function totalMs(): int
    {
        return $this->totalMs;
    }

    public function totalMinutos(): int
    {
        return (int) round($this->totalMs / 60000);
    }

    public function maisRecenteEm(): \DateTimeImmutable
    {
        return $this->maisRecenteEm;
    }

    public function chaveIdentificacao(): string
    {
        if (null !== $this->analise?->musicaUuid) {
            return 'musica:' . $this->analise->musicaUuid;
        }

        if (null !== $this->codigoFaixa && '' !== trim($this->codigoFaixa)) {
            return 'track:' . trim($this->codigoFaixa);
        }

        return sprintf('meta:%s|%s', mb_strtolower(trim($this->nomeFaixa)), mb_strtolower(trim($this->artistaPrincipal)));
    }
}

