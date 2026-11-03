<?php

declare(strict_types=1);

namespace App\DataObject;

final readonly class TrechoNarracaoDTO
{
    /**
     * @param list<PalavraNarracaoDTO> $palavras
     */
    public function __construct(
        public float $inicio,
        public float $fim,
        public string $texto,
        public array $palavras = [],
    ) {}

    /**
     * @return array{inicio: float, fim: float, texto: string, palavras: list<array{inicio: float, fim: float, texto: string}>}
     */
    public function paraArray(): array
    {
        return [
            'inicio' => $this->inicio,
            'fim' => $this->fim,
            'texto' => $this->texto,
            'palavras' => array_map(
                static fn(PalavraNarracaoDTO $palavra): array => $palavra->paraArray(),
                $this->palavras,
            ),
        ];
    }
}
