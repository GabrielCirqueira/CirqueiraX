<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class MinutosPorDiaDTO
{
    public function __construct(
        private string $data,
        private int $dia,
        private int $minutos,
    ) {}

    public function data(): string
    {
        return $this->data;
    }

    public function dia(): int
    {
        return $this->dia;
    }

    public function minutos(): int
    {
        return $this->minutos;
    }
}

