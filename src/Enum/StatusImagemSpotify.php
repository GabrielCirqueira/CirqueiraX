<?php

declare(strict_types=1);

namespace App\Enum;

enum StatusImagemSpotify: string
{
    case Pendente = 'pendente';
    case Encontrada = 'encontrada';
    case NaoEncontrada = 'nao_encontrada';

    public function isPendente(): bool
    {
        return self::Pendente === $this;
    }

    public function isEncontrada(): bool
    {
        return self::Encontrada === $this;
    }

    public function isNaoEncontrada(): bool
    {
        return self::NaoEncontrada === $this;
    }

    public function isFinalizado(): bool
    {
        return self::Encontrada === $this || self::NaoEncontrada === $this;
    }

    public function descricao(): string
    {
        return match ($this) {
            self::Pendente => 'Pendente',
            self::Encontrada => 'Encontrada',
            self::NaoEncontrada => 'Não Encontrada',
        };
    }
}

