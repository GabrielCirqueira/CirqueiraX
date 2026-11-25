<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

use App\Entity\ConsultaPronuncia;

final readonly class PaginaHistoricoPronunciaDTO
{
    /**
     * @param list<ConsultaPronuncia> $consultas
     */
    public function __construct(
        public array $consultas,
        public int $total,
    ) {
    }
}
