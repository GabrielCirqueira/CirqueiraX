<?php

declare(strict_types=1);

namespace App\Enum;

enum StatusLivroAudioBloco: string
{
    case PENDENTE = 'pendente';
    case GERANDO = 'gerando';
    case PRONTO = 'pronto';
    case ERRO = 'erro';

    public function descricao(): string
    {
        return match ($this) {
            self::PENDENTE => 'Pendente',
            self::GERANDO => 'Gerando áudio',
            self::PRONTO => 'Pronto',
            self::ERRO => 'Erro na síntese',
        };
    }

    public function isPendente(): bool
    {
        return self::PENDENTE === $this;
    }

    public function isGerando(): bool
    {
        return self::GERANDO === $this;
    }

    public function isPronto(): bool
    {
        return self::PRONTO === $this;
    }

    public function isErro(): bool
    {
        return self::ERRO === $this;
    }

    public function isFinal(): bool
    {
        return self::PRONTO === $this || self::ERRO === $this;
    }
}
