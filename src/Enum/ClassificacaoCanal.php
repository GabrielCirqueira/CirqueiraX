<?php

declare(strict_types=1);

namespace App\Enum;

enum ClassificacaoCanal: string
{
    case Musica = 'musica';
    case NaoMusica = 'nao_musica';

    public function descricao(): string
    {
        return match ($this) {
            self::Musica => 'Canal de música',
            self::NaoMusica => 'Canal que não é de música',
        };
    }

    public function isMusica(): bool
    {
        return self::Musica === $this;
    }

    public function isNaoMusica(): bool
    {
        return self::NaoMusica === $this;
    }
}
