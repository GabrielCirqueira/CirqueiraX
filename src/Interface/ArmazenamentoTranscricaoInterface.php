<?php

declare(strict_types=1);

namespace App\Interface;

use Symfony\Component\HttpFoundation\File\UploadedFile;

interface ArmazenamentoTranscricaoInterface
{
    public function salvarAudio(UploadedFile $arquivo, string $transcricaoUuid): string;

    public function existe(string $caminho): bool;

    public function remover(string $caminho): int;
}
