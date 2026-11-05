<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class CuriosidadesSpotifyDTO
{
    public function __construct(
        private ?string $horarioPico,
        private int $minutosHorarioPico,
        private ?string $diaSemanaMaisOuvido,
        private int $minutosDiaSemana,
        private ?string $diaMaisLongoData,
        private int $diaMaisLongoMinutos,
        private ?string $faixaMaisRepetidaNome,
        private ?string $faixaMaisRepetidaArtista,
        private int $faixaMaisRepetidaVezes,
        private ?string $faixaMaisRepetidaData,
        private int $artistasDescobertosNoMes,
        private int $mediaMinutosDiarios,
        private ?int $variacaoMediaDiariaPercentual,
    ) {}

    public function horarioPico(): ?string
    {
        return $this->horarioPico;
    }

    public function minutosHorarioPico(): int
    {
        return $this->minutosHorarioPico;
    }

    public function diaSemanaMaisOuvido(): ?string
    {
        return $this->diaSemanaMaisOuvido;
    }

    public function minutosDiaSemana(): int
    {
        return $this->minutosDiaSemana;
    }

    public function diaMaisLongoData(): ?string
    {
        return $this->diaMaisLongoData;
    }

    public function diaMaisLongoMinutos(): int
    {
        return $this->diaMaisLongoMinutos;
    }

    public function faixaMaisRepetidaNome(): ?string
    {
        return $this->faixaMaisRepetidaNome;
    }

    public function faixaMaisRepetidaArtista(): ?string
    {
        return $this->faixaMaisRepetidaArtista;
    }

    public function faixaMaisRepetidaVezes(): int
    {
        return $this->faixaMaisRepetidaVezes;
    }

    public function faixaMaisRepetidaData(): ?string
    {
        return $this->faixaMaisRepetidaData;
    }

    public function artistasDescobertosNoMes(): int
    {
        return $this->artistasDescobertosNoMes;
    }

    public function mediaMinutosDiarios(): int
    {
        return $this->mediaMinutosDiarios;
    }

    public function variacaoMediaDiariaPercentual(): ?int
    {
        return $this->variacaoMediaDiariaPercentual;
    }
}

