<?php

declare(strict_types=1);

namespace App\Enum;

enum FonteReproducaoYoutube: string
{
    case Coletor = 'coletor';
    case Takeout = 'takeout';
    case Extensao = 'extensao';

    public function descricao(): string
    {
        return match ($this) {
            self::Coletor => 'Coleta automática do YouTube Music',
            self::Takeout => 'Importação do Google Takeout',
            self::Extensao => 'Extensão do navegador',
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

    public function isExtensao(): bool
    {
        return self::Extensao === $this;
    }
}
