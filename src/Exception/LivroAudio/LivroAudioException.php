<?php

declare(strict_types=1);

namespace App\Exception\LivroAudio;

use DomainException;

final class LivroAudioException extends DomainException
{
    public static function livroNaoEncontrado(string $uuid): self
    {
        return new self(sprintf('O livro em áudio com identificador "%s" não foi encontrado.', $uuid), 404);
    }

    public static function arquivoInvalido(string $motivo): self
    {
        return new self(sprintf('O arquivo enviado é inválido: %s', $motivo), 422);
    }

    public static function arquivoNaoEnviado(): self
    {
        return new self('Nenhum arquivo PDF foi enviado na requisição.', 400);
    }

    public static function falhaAoSalvarArquivoPdf(): self
    {
        return new self('Ocorreu uma falha ao salvar o arquivo PDF no armazenamento local.', 500);
    }

    public static function falhaAoRemoverLivro(): self
    {
        return new self('Ocorreu uma falha ao remover os arquivos do livro em áudio do disco.', 500);
    }

    public static function arquivoPdfNaoEncontrado(string $caminho): self
    {
        return new self(sprintf('O arquivo PDF não foi encontrado no caminho "%s".', $caminho), 404);
    }

    public static function blocoNaoEncontrado(int $numeroBloco): self
    {
        return new self(sprintf('O bloco de número %d do livro em áudio não foi encontrado.', $numeroBloco), 404);
    }

    public static function audioBlocoNaoDisponivel(int $numeroBloco): self
    {
        return new self(sprintf('O áudio do bloco %d ainda não está disponível para reprodução.', $numeroBloco), 404);
    }
}
