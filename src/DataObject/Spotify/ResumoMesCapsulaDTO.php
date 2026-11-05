<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class ResumoMesCapsulaDTO
{
    public function __construct(
        private int $ano,
        private int $mes,
        private string $rotulo,
        private int $totalMinutos,
        private int $totalStreams,
        private ?string $musicaMaisOuvida,
        private ?string $artistaMaisOuvido,
        private bool $isEmAndamento,
    ) {}

    public function ano(): int
    {
        return $this->ano;
    }

    public function mes(): int
    {
        return $this->mes;
    }

    public function rotulo(): string
    {
        return $this->rotulo;
    }

    public function totalMinutos(): int
    {
        return $this->totalMinutos;
    }

    public function totalStreams(): int
    {
        return $this->totalStreams;
    }

    public function musicaMaisOuvida(): ?string
    {
        return $this->musicaMaisOuvida;
    }

    public function artistaMaisOuvido(): ?string
    {
        return $this->artistaMaisOuvido;
    }

    public function isEmAndamento(): bool
    {
        return $this->isEmAndamento;
    }
}

