<?php

declare(strict_types=1);

namespace App\Enum;

enum StatusAudio: string
{
    case PENDENTE = 'pendente';
    case BAIXANDO = 'baixando';
    case DISPONIVEL = 'disponivel';
    case ERRO = 'erro';
    case EXPIRADO = 'expirado';

    public function descricao(): string
    {
        return match ($this) {
            self::PENDENTE => 'Na fila',
            self::BAIXANDO => 'Baixando',
            self::DISPONIVEL => 'Disponível',
            self::ERRO => 'Erro',
            self::EXPIRADO => 'Expirado',
        };
    }

    public function isPendente(): bool
    {
        return self::PENDENTE === $this;
    }

    public function isEmProcessamento(): bool
    {
        return self::PENDENTE === $this || self::BAIXANDO === $this;
    }

    public function isDisponivel(): bool
    {
        return self::DISPONIVEL === $this;
    }

    public function isRebaixavel(): bool
    {
        return self::ERRO === $this || self::EXPIRADO === $this;
    }
}
