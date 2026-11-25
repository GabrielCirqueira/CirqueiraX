<?php

declare(strict_types=1);

namespace App\Enum;

enum StatusFrasePronuncia: string
{
    case Ok = 'ok';
    case Reportada = 'reportada';
    case Corrigida = 'corrigida';

    public function descricao(): string
    {
        return match ($this) {
            self::Ok => 'Sem relatos',
            self::Reportada => 'Erro reportado',
            self::Corrigida => 'Corrigida',
        };
    }
}
