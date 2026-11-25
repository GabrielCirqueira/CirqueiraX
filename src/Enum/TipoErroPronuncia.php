<?php

declare(strict_types=1);

namespace App\Enum;

enum TipoErroPronuncia: string
{
    case Traducao = 'traducao';
    case Pronuncia = 'pronuncia';

    public function descricao(): string
    {
        return match ($this) {
            self::Traducao => 'Tradução',
            self::Pronuncia => 'Pronúncia',
        };
    }
}
