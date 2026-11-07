<?php

declare(strict_types=1);

namespace App\DataObject\Transcricao;

final readonly class ResultadoTranscricaoDTO
{
    /**
     * @param list<SegmentoTranscricaoDTO> $segmentos
     */
    public function __construct(
        public array $segmentos,
        public ?string $idiomaDetectado,
    ) {}

    public function isVazio(): bool
    {
        return [] === $this->segmentos;
    }
}
