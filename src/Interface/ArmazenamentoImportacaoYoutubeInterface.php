<?php

declare(strict_types=1);

namespace App\Interface;

use Symfony\Component\HttpFoundation\File\UploadedFile;

interface ArmazenamentoImportacaoYoutubeInterface
{
    public function salvarArquivoTemporario(UploadedFile $arquivo, string $importacaoUuid): string;

    public function removerArquivo(string $caminho): void;
}
