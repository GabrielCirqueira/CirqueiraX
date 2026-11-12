<?php

declare(strict_types=1);

namespace App\Exception\Notificacao;

use DomainException;

final class NotificacaoException extends DomainException
{
    private const int CODIGO_DADOS_INVALIDOS = 422;
    private const int CODIGO_USUARIO_NAO_ENCONTRADO = 404;

    public static function tituloInvalido(int $limite): self
    {
        return new self(sprintf('O título precisa ter entre 1 e %d caracteres.', $limite), self::CODIGO_DADOS_INVALIDOS);
    }

    public static function mensagemVazia(): self
    {
        return new self('A mensagem da notificação não pode ficar vazia.', self::CODIGO_DADOS_INVALIDOS);
    }

    public static function usuarioNaoEncontrado(int $usuarioId): self
    {
        return new self(sprintf('Usuário %d não encontrado.', $usuarioId), self::CODIGO_USUARIO_NAO_ENCONTRADO);
    }
}
