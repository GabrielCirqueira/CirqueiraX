<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

use App\Entity\LetraMusicaPronuncia;

final readonly class LetraMusicaPronunciadaDTO
{
    /**
     * @param list<AnalisePronunciaDTO|null> $analises
     */
    public function __construct(
        public LetraMusicaPronuncia $letra,
        public array $analises,
    ) {
    }
}
