<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

final readonly class UsoTraducaoDTO
{
    public function __construct(
        public int $caracteresUsados,
        public int $limiteCaracteres,
        public bool $configurado,
    ) {
    }

    public static function naoConfigurado(): self
    {
        return new self(0, 0, false);
    }

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'configurado' => $this->configurado,
            'caracteresUsados' => $this->caracteresUsados,
            'limiteCaracteres' => $this->limiteCaracteres,
        ];
    }
}
