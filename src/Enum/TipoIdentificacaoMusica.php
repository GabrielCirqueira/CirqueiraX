<?php

declare(strict_types=1);

namespace App\Enum;

enum TipoIdentificacaoMusica: string
{
    case Musica = 'musica';
    case Mashup = 'mashup';
    case Compilacao = 'compilacao';
    case NaoMusica = 'nao_musica';

    public function descricao(): string
    {
        return match ($this) {
            self::Musica => 'Música',
            self::Mashup => 'Mashup',
            self::Compilacao => 'Compilação',
            self::NaoMusica => 'Não é música',
        };
    }

    public function isMashup(): bool
    {
        return self::Mashup === $this;
    }

    public function isMusica(): bool
    {
        return self::Musica === $this;
    }
}
