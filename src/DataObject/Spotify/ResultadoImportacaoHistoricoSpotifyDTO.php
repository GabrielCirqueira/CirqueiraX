<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class ResultadoImportacaoHistoricoSpotifyDTO
{
    public function __construct(
        private int $totalLidos,
        private int $totalNovos,
        private int $totalIgnorados,
        private int $totalSubstituidos,
    ) {}

    public function totalLidos(): int
    {
        return $this->totalLidos;
    }

    public function totalNovos(): int
    {
        return $this->totalNovos;
    }

    public function totalIgnorados(): int
    {
        return $this->totalIgnorados;
    }

    public function totalSubstituidos(): int
    {
        return $this->totalSubstituidos;
    }
}
