<?php

declare(strict_types=1);

namespace App\DataObject;

use App\Entity\RegistroEnvioGoogleFotos;

final readonly class PaginaRegistrosEnvioGoogleFotosDTO
{
    /**
     * @param list<RegistroEnvioGoogleFotos> $registros
     */
    public function __construct(
        public array $registros,
        public int $total,
    ) {}

    /**
     * @return list<RegistroEnvioGoogleFotos>
     */
    public function registros(): array
    {
        return $this->registros;
    }

    public function total(): int
    {
        return $this->total;
    }
}
