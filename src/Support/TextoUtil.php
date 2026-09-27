<?php

declare(strict_types=1);

namespace App\Support;

final class TextoUtil
{
    public static function estaEmBranco(?string $valor): bool
    {
        return null === $valor || '' === trim($valor);
    }

    public static function naoEstaEmBranco(?string $valor): bool
    {
        return !self::estaEmBranco($valor);
    }
}
