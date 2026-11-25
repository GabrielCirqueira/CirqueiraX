<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

final readonly class SentencaPronunciadaDTO
{
    /**
     * @param list<PalavraPronunciadaDTO|TokenTextoDTO> $itens
     */
    public function __construct(
        public string $texto,
        public array $itens,
        public string $pronuncia,
        public string $falaNatural,
    ) {
    }

    /**
     * @return list<PalavraPronunciadaDTO>
     */
    public function palavras(): array
    {
        return array_values(array_filter($this->itens, static fn (PalavraPronunciadaDTO|TokenTextoDTO $item): bool => $item instanceof PalavraPronunciadaDTO));
    }

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'texto' => $this->texto,
            'pronuncia' => $this->pronuncia,
            'falaNatural' => $this->falaNatural,
            'itens' => array_map(
                static fn (PalavraPronunciadaDTO|TokenTextoDTO $item): array => $item instanceof PalavraPronunciadaDTO
                    ? ['tipo' => 'palavra', ...$item->paraArray()]
                    : ['tipo' => 'pontuacao', 'texto' => $item->texto],
                $this->itens,
            ),
        ];
    }
}
