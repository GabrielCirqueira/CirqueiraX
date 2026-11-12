<?php

declare(strict_types=1);

namespace App\Exception\Musica;

use DomainException;

final class CapaMusicaException extends DomainException
{
    private const int CODIGO_NAO_ENCONTRADA = 404;

    public static function naoDisponivel(): self
    {
        return new self('Capa não disponível.', self::CODIGO_NAO_ENCONTRADA);
    }
}
