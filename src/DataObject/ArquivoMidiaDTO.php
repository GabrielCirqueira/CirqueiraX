<?php

declare(strict_types=1);

namespace App\DataObject;

final readonly class ArquivoMidiaDTO
{
    public function __construct(
        public string $caminhoFisico,
        public string $nomeArquivo,
        public string $mimeType,
    ) {}

    public function caminhoFisico(): string
    {
        return $this->caminhoFisico;
    }

    public function nomeArquivo(): string
    {
        return $this->nomeArquivo;
    }

    public function mimeType(): string
    {
        return $this->mimeType;
    }
}
