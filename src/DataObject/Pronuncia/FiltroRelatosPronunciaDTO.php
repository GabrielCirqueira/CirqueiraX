<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

final readonly class FiltroRelatosPronunciaDTO
{
    public function __construct(
        public bool $todos = false,
    ) {
    }

    public function isSomenteEmAberto(): bool
    {
        return !$this->todos;
    }
}
