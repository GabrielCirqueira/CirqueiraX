<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

final readonly class CorrecaoPalavraPronunciaDTO
{
    public function __construct(
        public string $palavra,
        public string $pronuncia,
    ) {
    }

    /**
     * @return array{palavra: string, pronuncia: string}
     */
    public function paraArray(): array
    {
        return ['palavra' => $this->palavra, 'pronuncia' => $this->pronuncia];
    }
}
