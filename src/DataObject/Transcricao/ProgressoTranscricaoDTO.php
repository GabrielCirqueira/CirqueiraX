<?php

declare(strict_types=1);

namespace App\DataObject\Transcricao;

final readonly class ProgressoTranscricaoDTO
{
    /**
     * @param list<SegmentoTranscricaoDTO> $segmentosParciais
     */
    public function __construct(
        public int $percentual,
        public array $segmentosParciais,
    ) {}
}
