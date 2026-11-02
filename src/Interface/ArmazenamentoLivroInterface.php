<?php

declare(strict_types=1);

namespace App\Interface;

use Symfony\Component\HttpFoundation\File\UploadedFile;

interface ArmazenamentoLivroInterface
{
    public function salvarPdf(UploadedFile $arquivo, string $livroUuid): string;

    public function obterCaminhoPdf(string $livroUuid): string;

    public function contarPaginasPdf(string $caminhoPdf): int;

    public function removerLivro(string $livroUuid): void;

    public function existePdf(string $livroUuid): bool;
}
