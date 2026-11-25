<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

use App\Enum\OrigemPronunciaPalavra;

final readonly class FonemasResolvidosDTO
{
    /**
     * @param list<string> $fonemas
     */
    public function __construct(
        public OrigemPronunciaPalavra $origem,
        public array $fonemas = [],
        public ?string $pronunciaFigurada = null,
    ) {
    }

    public function isFigurada(): bool
    {
        return null !== $this->pronunciaFigurada;
    }
}
