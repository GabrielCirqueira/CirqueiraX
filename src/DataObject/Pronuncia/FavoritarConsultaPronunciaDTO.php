<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

final readonly class FavoritarConsultaPronunciaDTO
{
    public function __construct(
        public bool $favorita = true,
    ) {
    }

    public function isFavorita(): bool
    {
        return $this->favorita;
    }
}
