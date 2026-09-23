<?php

declare(strict_types=1);

namespace App\Enum;

enum TipoCliente: string
{
    case USUARIO = 'usuario';
    case AGENTE = 'agente';

    public function descricao(): string
    {
        return match ($this) {
            self::USUARIO => 'Usuário Humano',
            self::AGENTE => 'Agente Automatizado / Serviço',
        };
    }
}
