<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

use App\Enum\FonteReproducaoSpotify;
use DateTimeImmutable;

final readonly class ItemHistoricoImportadoDTO
{
    public function __construct(
        public ?string $codigoFaixa,
        public string $nomeFaixa,
        public string $artistaPrincipal,
        public ?string $album,
        public int $msReproduzidos,
        public DateTimeImmutable $tocadaEm,
        public FonteReproducaoSpotify $fonte,
        public ?bool $pulada = null,
        public ?bool $aleatorio = null,
    ) {
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

    public function album(): ?string
    {
        return $this->album;
    }

    public function msReproduzidos(): int
    {
        return $this->msReproduzidos;
    }

    public function tocadaEm(): DateTimeImmutable
    {
        return $this->tocadaEm;
    }

    public function fonte(): FonteReproducaoSpotify
    {
        return $this->fonte;
    }
}

