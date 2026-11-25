<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

final readonly class LinhaLetraDTO
{
    public function __construct(
        public ?int $inicioMs,
        public string $texto,
    ) {
    }

    /**
     * @return array{inicioMs: int|null, texto: string}
     */
    public function paraArray(): array
    {
        return ['inicioMs' => $this->inicioMs, 'texto' => $this->texto];
    }

    /**
     * @param array<mixed> $dados
     */
    public static function doArray(array $dados): self
    {
        return new self(
            is_int($dados['inicioMs'] ?? null) ? $dados['inicioMs'] : null,
            is_string($dados['texto'] ?? null) ? $dados['texto'] : '',
        );
    }
}
