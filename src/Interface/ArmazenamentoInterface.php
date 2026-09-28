<?php

declare(strict_types=1);

namespace App\Interface;

interface ArmazenamentoInterface
{
    public function criarDiretorio(string $caminho, int $permissao = 0o755): void;

    public function remover(string $caminhoArquivo): void;

    public function copiar(string $origem, string $destino): void;

    public function existe(string $caminhoArquivo): bool;

    public function calcularHash(string $caminhoArquivo): string;
}
