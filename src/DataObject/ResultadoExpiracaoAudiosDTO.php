<?php

declare(strict_types=1);

namespace App\DataObject;

final readonly class ResultadoExpiracaoAudiosDTO
{
    /**
     * @param array<string, string> $falhas
     */
    public function __construct(
        public int $totalExpirados,
        public int $totalInterrompidos,
        public int $bytesLiberados,
        public array $falhas,
    ) {}

    public function totalExpirados(): int
    {
        return $this->totalExpirados;
    }

    public function totalInterrompidos(): int
    {
        return $this->totalInterrompidos;
    }

    public function bytesLiberados(): int
    {
        return $this->bytesLiberados;
    }

    /**
     * @return array<string, string>
     */
    public function falhas(): array
    {
        return $this->falhas;
    }
}
