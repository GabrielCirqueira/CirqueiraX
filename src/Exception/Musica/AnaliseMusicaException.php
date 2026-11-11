<?php

declare(strict_types=1);

namespace App\Exception\Musica;

use DomainException;

final class AnaliseMusicaException extends DomainException
{
    private const int CODIGO_NAO_ENCONTRADO = 404;
    private const int CODIGO_INVALIDO = 422;

    public static function semReproducoes(string $nome): self
    {
        return new self(sprintf('Nenhuma reprodução de "%s" foi encontrada no seu histórico.', $nome), self::CODIGO_NAO_ENCONTRADO);
    }

    public static function fonteInvalida(string $fonte): self
    {
        return new self(sprintf('Fonte "%s" inválida. Use todas, spotify ou youtube_music.', $fonte), self::CODIGO_INVALIDO);
    }

    public static function naoEncontradaNoCatalogo(): self
    {
        return new self('Não foi possível encontrar essa música ou artista no catálogo.', self::CODIGO_NAO_ENCONTRADO);
    }
}
