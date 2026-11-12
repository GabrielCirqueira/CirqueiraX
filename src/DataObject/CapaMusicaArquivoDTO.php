<?php

declare(strict_types=1);

namespace App\DataObject;

final readonly class CapaMusicaArquivoDTO
{
    public function __construct(
        public string $caminho,
        public string $tipoConteudo,
    ) {}
}
