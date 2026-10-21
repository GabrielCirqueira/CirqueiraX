<?php

declare(strict_types=1);

namespace App\Interface;

use DateTimeImmutable;

interface MetadataImagemInterface
{
    public function gerarCopiaPngComData(string $caminhoArquivo, DateTimeImmutable $dataCaptura): ?string;

    public function removerCopia(string $caminhoCopia): void;
}
