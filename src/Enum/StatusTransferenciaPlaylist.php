<?php

declare(strict_types=1);

namespace App\Enum;

enum StatusTransferenciaPlaylist: string
{
    case Rascunho = 'rascunho';
    case Casando = 'casando';
    case Previa = 'previa';
    case Executando = 'executando';
    case PausadaCota = 'pausada_cota';
    case Concluida = 'concluida';
    case Falha = 'falha';

    public function isEditavel(): bool
    {
        return self::Rascunho === $this || self::Previa === $this;
    }

    public function isEmAndamento(): bool
    {
        return self::Casando === $this || self::Executando === $this;
    }

    public function isFinalizada(): bool
    {
        return self::Concluida === $this || self::Falha === $this;
    }

    public function isRascunho(): bool
    {
        return self::Rascunho === $this;
    }

    public function isCasando(): bool
    {
        return self::Casando === $this;
    }

    public function isPrevia(): bool
    {
        return self::Previa === $this;
    }

    public function isExecutando(): bool
    {
        return self::Executando === $this;
    }

    public function isPausadaCota(): bool
    {
        return self::PausadaCota === $this;
    }

    public function isConcluida(): bool
    {
        return self::Concluida === $this;
    }

    public function isFalha(): bool
    {
        return self::Falha === $this;
    }

    public function descricao(): string
    {
        return match ($this) {
            self::Rascunho => 'Rascunho',
            self::Casando => 'Casando faixas',
            self::Previa => 'Prévia',
            self::Executando => 'Executando',
            self::PausadaCota => 'Pausada por cota',
            self::Concluida => 'Concluída',
            self::Falha => 'Falha',
        };
    }
}
