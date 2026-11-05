<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class TotaisMesDTO
{
    public function __construct(
        private int $totalMinutos,
        private int $totalStreams,
        private int $faixasDistintas,
    ) {}

    public function totalMinutos(): int
    {
        return $this->totalMinutos;
    }

    public function totalStreams(): int
    {
        return $this->totalStreams;
    }

    public function faixasDistintas(): int
    {
        return $this->faixasDistintas;
    }
}

