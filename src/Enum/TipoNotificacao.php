<?php

declare(strict_types=1);

namespace App\Enum;

enum TipoNotificacao: string
{
    case Melhoria = 'melhoria';
    case Correcao = 'correcao';
    case Novidade = 'novidade';
    case Aviso = 'aviso';

    public function descricao(): string
    {
        return match ($this) {
            self::Melhoria => 'Melhoria',
            self::Correcao => 'Correção',
            self::Novidade => 'Novidade',
            self::Aviso => 'Aviso',
        };
    }
}
