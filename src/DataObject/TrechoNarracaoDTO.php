<?php

declare(strict_types=1);

namespace App\DataObject;

final readonly class TrechoNarracaoDTO
{
    public function __construct(
        public float $inicio,
        public float $fim,
        public string $texto,
    ) {}

    /**
     * @return array{inicio: float, fim: float, texto: string}
     */
    public function paraArray(): array
    {
        return [
            'inicio' => $this->inicio,
            'fim' => $this->fim,
            'texto' => $this->texto,
        ];
    }
}
