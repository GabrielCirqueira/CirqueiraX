<?php

declare(strict_types=1);

namespace App\DataObject\Transcricao;

final readonly class ResultadoExpiracaoAudiosTranscricaoDTO
{
    /**
     * @param array<string, string> $falhas
     */
    public function __construct(
        public int $totalExpirados,
        public int $totalInterrompidas,
        public int $bytesLiberados,
        public array $falhas,
    ) {}
}
