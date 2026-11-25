<?php

declare(strict_types=1);

namespace App\Exception\Pronuncia;

final class LetraMusicaException extends \DomainException
{
    private const int CODIGO_NAO_ENCONTRADO = 404;
    private const int CODIGO_INVALIDO = 422;
    private const int CODIGO_INDISPONIVEL = 503;

    public static function servicoIndisponivel(): self
    {
        return new self('O serviço de letras não respondeu agora. Tente de novo em instantes.', self::CODIGO_INDISPONIVEL);
    }

    public static function letraNaoEncontrada(): self
    {
        return new self('Letra não encontrada.', self::CODIGO_NAO_ENCONTRADO);
    }

    public static function semLinhasParaTraduzir(): self
    {
        return new self('Esta música não tem letra para traduzir.', self::CODIGO_INVALIDO);
    }
}
