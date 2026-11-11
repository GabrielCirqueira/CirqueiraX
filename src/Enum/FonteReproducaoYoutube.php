<?php

declare(strict_types=1);

namespace App\Enum;

enum FonteReproducaoYoutube: string
{
    case Coletor = 'coletor';
    case Takeout = 'takeout';

    public function descricao(): string
    {
        return match ($this) {
            self::Coletor => 'Coleta automática do YouTube Music',
            self::Takeout => 'Importação do Google Takeout',
        };
    }

    public function isColetor(): bool
    {
        return self::Coletor === $this;
    }

    public function isTakeout(): bool
    {
        return self::Takeout === $this;
    }
}
