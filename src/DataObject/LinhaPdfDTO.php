<?php

declare(strict_types=1);

namespace App\DataObject;

final readonly class LinhaPdfDTO
{
    private const float PROPORCAO_SOBRESCRITO = 0.72;

    /**
     * @param list<array{texto: string, altura: float}> $palavras
     */
    public function __construct(
        public array $palavras,
        public float $yMin,
        public float $yMax,
        public int $bloco,
    ) {}

    public function altura(): float
    {
        return $this->yMax - $this->yMin;
    }

    public function texto(): string
    {
        return implode(' ', array_column($this->palavras, 'texto'));
    }

    public function textoSemSobrescritos(): string
    {
        $alturaMaxima = max(array_column($this->palavras, 'altura') ?: [0.0]);
        $palavras = array_filter(
            $this->palavras,
            static fn(array $palavra): bool => !(1 === preg_match('/^\d{1,3}$/', $palavra['texto'])
                && $palavra['altura'] < $alturaMaxima * self::PROPORCAO_SOBRESCRITO),
        );

        return implode(' ', array_column($palavras, 'texto'));
    }
}
