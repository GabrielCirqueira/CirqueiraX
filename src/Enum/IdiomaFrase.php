<?php

declare(strict_types=1);

namespace App\Enum;

enum IdiomaFrase: string
{
    case Portugues = 'pt';
    case Ingles = 'en';

    public function codigoDestinoDeepL(): string
    {
        return match ($this) {
            self::Portugues => 'PT-BR',
            self::Ingles => 'EN-US',
        };
    }

    public function oposto(): self
    {
        return match ($this) {
            self::Portugues => self::Ingles,
            self::Ingles => self::Portugues,
        };
    }

    public function isIngles(): bool
    {
        return self::Ingles === $this;
    }

    public static function doCodigoDeepL(string $codigo): ?self
    {
        $prefixo = strtolower(substr($codigo, 0, 2));

        return self::tryFrom($prefixo);
    }
}
