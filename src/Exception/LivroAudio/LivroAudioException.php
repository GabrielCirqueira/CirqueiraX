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

    public static function vozIndisponivel(string $voz): self
    {
        return new self(sprintf('A voz "%s" não está disponível para este livro.', $voz), 422);
    }

    public static function marcacaoNaoEncontrada(string $uuid): self
    {
        return new self(sprintf('A marcação "%s" não foi encontrada.', $uuid), 404);
    }

    public static function notaVazia(): self
    {
        return new self('Escreva o texto da nota.', 422);
    }

    public static function limiteMarcacoes(int $limite): self
    {
        return new self(sprintf('O livro já tem %d marcações. Apague algumas para criar novas.', $limite), 422);
    }

    public static function narracaoEmPreparo(): self
    {
        return new self('O texto do livro ainda está sendo extraído. Aguarde para ajustar a narração.', 409);
    }

    public static function vozPrincipalNaoRemovivel(): self
    {
        return new self('A voz principal do livro não pode ser removida.', 422);
    }

    public static function falhaAoGerarAmostra(string $voz): self
    {
        return new self(sprintf('Não foi possível gerar a amostra da voz "%s".', $voz), 502);
    }
}
