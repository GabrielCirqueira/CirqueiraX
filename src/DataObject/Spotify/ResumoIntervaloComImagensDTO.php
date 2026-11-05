<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class ResumoIntervaloComImagensDTO
{
    public function __construct(
        private ResumoIntervaloSpotifyDTO $intervalo,
        private string $rotuloPeriodo,
        private string $dataInicio,
        private string $dataFim,
        private MapaImagensSpotifyDTO $mapaImagens,
    ) {}

    public function intervalo(): ResumoIntervaloSpotifyDTO
    {
        return $this->intervalo;
    }

    public function rotuloPeriodo(): string
    {
        return $this->rotuloPeriodo;
    }

    public function dataInicio(): string
    {
        return $this->dataInicio;
    }

    public function dataFim(): string
    {
        return $this->dataFim;
    }

    public function mapaImagens(): MapaImagensSpotifyDTO
    {
        return $this->mapaImagens;
    }
}
