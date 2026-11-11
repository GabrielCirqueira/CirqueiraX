<?php

declare(strict_types=1);

namespace App\Enum;

enum AcaoRevisaoVideo: string
{
    case DefinirMusica = 'definir_musica';
    case NaoMusica = 'nao_musica';
    case ManterCompilacao = 'manter_compilacao';

    public function descricao(): string
    {
        return match ($this) {
            self::DefinirMusica => 'Definir a música',
            self::NaoMusica => 'Não é música',
            self::ManterCompilacao => 'Manter como compilação',
        };
    }
}
