<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class MesDisponivelDTO
{
    public function __construct(
        private int $ano,
        private int $mes,
        private int $totalReproducoes,
        private int $totalMinutos,
    ) {}

    public function ano(): int
    {
        return $this->ano;
    }

    public function mes(): int
    {
        return $this->mes;
    }

    public function totalReproducoes(): int
    {
        return $this->totalReproducoes;
    }

    public function totalMinutos(): int
    {
        return $this->totalMinutos;
    }

    public function rotulo(): string
    {
        $meses = [
            1 => 'Janeiro',
            2 => 'Fevereiro',
            3 => 'Março',
            4 => 'Abril',
            5 => 'Maio',
            6 => 'Junho',
            7 => 'Julho',
            8 => 'Agosto',
            9 => 'Setembro',
            10 => 'Outubro',
            11 => 'Novembro',
            12 => 'Dezembro',
        ];

        return sprintf('%s de %d', $meses[$this->mes] ?? (string) $this->mes, $this->ano);
    }
}

