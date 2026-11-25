<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

final readonly class TokenTextoDTO
{
    public function __construct(
        public string $texto,
        public bool $palavra,
    ) {
    }

    public function chave(): string
    {
        return mb_strtolower(str_replace('’', "'", $this->texto));
    }

    public function isPalavra(): bool
    {
        return $this->palavra;
    }
}
