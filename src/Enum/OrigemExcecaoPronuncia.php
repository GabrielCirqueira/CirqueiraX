<?php

declare(strict_types=1);

namespace App\Enum;

enum OrigemExcecaoPronuncia: string
{
    case Manual = 'manual';
    case Ia = 'ia';

    public function descricao(): string
    {
        return match ($this) {
            self::Manual => 'Cadastrada à mão',
            self::Ia => 'Sugerida pela IA e aprovada',
        };
    }
}
