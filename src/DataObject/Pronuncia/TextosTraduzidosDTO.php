<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

use App\Enum\IdiomaFrase;

final readonly class TextosTraduzidosDTO
{
    public function __construct(
        public IdiomaFrase $idiomaOrigem,
        public string $portugues,
        public string $ingles,
    ) {
    }
}
