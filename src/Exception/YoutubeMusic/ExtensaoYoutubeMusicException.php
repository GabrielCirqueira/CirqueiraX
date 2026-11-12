<?php

declare(strict_types=1);

namespace App\Exception\YoutubeMusic;

use DomainException;

final class ExtensaoYoutubeMusicException extends DomainException
{
    private const int CODIGO_LIMITE_APARELHOS = 422;
    private const int CODIGO_NAO_ENCONTRADO = 404;
    private const int CODIGO_MUITOS_EVENTOS = 429;

    public static function limiteDeAparelhos(int $limite): self
    {
        return new self(sprintf('Você já tem %d aparelhos com a extensão. Revogue um antes de gerar outro token.', $limite), self::CODIGO_LIMITE_APARELHOS);
    }

    public static function tokenNaoEncontrado(): self
    {
        return new self('Token da extensão não encontrado.', self::CODIGO_NAO_ENCONTRADO);
    }

    public static function muitosEventos(): self
    {
        return new self('A extensão enviou eventos demais. Os próximos serão aceitos em instantes.', self::CODIGO_MUITOS_EVENTOS);
    }
}
