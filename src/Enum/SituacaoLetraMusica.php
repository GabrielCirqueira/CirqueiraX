<?php

declare(strict_types=1);

namespace App\Enum;

enum SituacaoLetraMusica: string
{
    case Sincronizada = 'sincronizada';
    case Simples = 'simples';
    case Instrumental = 'instrumental';
    case NaoEncontrada = 'nao_encontrada';

    public function descricao(): string
    {
        return match ($this) {
            self::Sincronizada => 'Letra sincronizada',
            self::Simples => 'Letra sem marcação de tempo',
            self::Instrumental => 'Música instrumental',
            self::NaoEncontrada => 'Letra não encontrada',
        };
    }

    public function temLinhas(): bool
    {
        return self::Sincronizada === $this || self::Simples === $this;
    }

    public function isNaoEncontrada(): bool
    {
        return self::NaoEncontrada === $this;
    }
}
