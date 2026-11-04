<?php

declare(strict_types=1);

namespace App\DataObject;

final readonly class PaginaPdfDTO
{
    /**
     * @param list<LinhaPdfDTO> $linhas
     */
    public function __construct(
        public int $numero,
        public float $altura,
        public array $linhas,
    ) {}
}
