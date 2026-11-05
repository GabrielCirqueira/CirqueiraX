<?php

declare(strict_types=1);

namespace App\Enum;

enum TipoMarcacaoLivroAudio: string
{
    case MARCADOR = 'marcador';
    case DESTAQUE = 'destaque';
    case NOTA = 'nota';

    public function descricao(): string
    {
        return match ($this) {
            self::MARCADOR => 'Marcador',
            self::DESTAQUE => 'Destaque',
            self::NOTA => 'Nota',
        };
    }
}
