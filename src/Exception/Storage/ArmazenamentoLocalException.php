<?php

declare(strict_types=1);

namespace App\Exception\Storage;

class ArmazenamentoLocalException extends \DomainException
{
    public static function falhaAoCriarDiretorioDeArmazenamento(): self
    {
        return new self('Não foi possível criar o diretório de armazenamento no sistema de arquivos local.', 500);
    }

    public static function falhaAoRemoverArquivoDoArmazenamento(): self
    {
        return new self('Ocorreu uma falha ao remover o arquivo do sistema de arquivos local.', 500);
    }

    public static function arquivoDeOrigemNaoEncontradoParaCopia(): self
    {
        return new self('O arquivo de origem especificado não foi encontrado para realizar a cópia.', 404);
    }

    public static function falhaAoCopiarArquivoParaDestino(): self
    {
        return new self('Ocorreu uma falha ao copiar o arquivo para o diretório de destino.', 500);
    }

    public static function arquivoNaoEncontrado(string $caminho): self
    {
        return new self(sprintf('O arquivo no caminho "%s" não foi encontrado ou não pode ser lido.', $caminho), 404);
    }

    public static function falhaCalcularHash(string $caminho): self
    {
        return new self(sprintf('Não foi possível calcular o hash SHA-256 para o arquivo no caminho "%s".', $caminho), 500);
    }
}
