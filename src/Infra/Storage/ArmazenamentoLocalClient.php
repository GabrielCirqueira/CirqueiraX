<?php

declare(strict_types=1);

namespace App\Infra\Storage;

use App\Exception\Storage\ArmazenamentoLocalException;
use App\Interface\ArmazenamentoInterface;

final class ArmazenamentoLocalClient implements ArmazenamentoInterface
{
    private const int PERMISSAO_DIRETORIO_PADRAO = 0o755;

    public function criarDiretorio(string $caminho, int $permissao = self::PERMISSAO_DIRETORIO_PADRAO): void
    {
        if (!is_dir($caminho) && !mkdir($caminho, $permissao, true) && !is_dir($caminho)) {
            throw ArmazenamentoLocalException::falhaAoCriarDiretorioDeArmazenamento();
        }
    }

    public function remover(string $caminhoArquivo): void
    {
        if ('' === $caminhoArquivo || !file_exists($caminhoArquivo) || !is_file($caminhoArquivo)) {
            return;
        }

        $removido = unlink($caminhoArquivo);
        if (!$removido) {
            throw ArmazenamentoLocalException::falhaAoRemoverArquivoDoArmazenamento();
        }
    }

    public function copiar(string $origem, string $destino): void
    {
        if (!file_exists($origem) || !is_file($origem)) {
            throw ArmazenamentoLocalException::arquivoDeOrigemNaoEncontradoParaCopia();
        }

        $diretorioDestino = dirname($destino);
        $this->criarDiretorio($diretorioDestino);

        $copiado = copy($origem, $destino);
        if (!$copiado) {
            throw ArmazenamentoLocalException::falhaAoCopiarArquivoParaDestino();
        }
    }

    public function existe(string $caminhoArquivo): bool
    {
        return '' !== $caminhoArquivo && file_exists($caminhoArquivo) && is_readable($caminhoArquivo);
    }

    public function calcularHash(string $caminhoArquivo): string
    {
        if (!$this->existe($caminhoArquivo)) {
            throw ArmazenamentoLocalException::arquivoNaoEncontrado($caminhoArquivo);
        }

        $hash = hash_file('sha256', $caminhoArquivo);
        if (false === $hash) {
            throw ArmazenamentoLocalException::falhaCalcularHash($caminhoArquivo);
        }

        return $hash;
    }
}
