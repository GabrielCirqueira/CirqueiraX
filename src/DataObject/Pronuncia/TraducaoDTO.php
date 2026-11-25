<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

use App\Enum\IdiomaFrase;

final readonly class TraducaoDTO
{
    public function __construct(
        public string $texto,
        public ?IdiomaFrase $idiomaDetectado,
    ) {
    }
}
