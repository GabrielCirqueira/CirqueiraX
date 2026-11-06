<?php

declare(strict_types=1);

namespace App\DataObject\Transcricao;

final readonly class SegmentoTranscricaoDTO
{
    public function __construct(
        public float $inicioSegundos,
        public float $fimSegundos,
        public string $texto,
    ) {}

    /**
     * @return array{inicio: float, fim: float, texto: string}
     */
    public function paraArray(): array
    {
        return [
            'inicio' => round($this->inicioSegundos, 2),
            'fim' => round($this->fimSegundos, 2),
            'texto' => $this->texto,
        ];
    }
}
