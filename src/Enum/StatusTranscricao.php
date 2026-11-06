<?php

declare(strict_types=1);

namespace App\Enum;

enum StatusTranscricao: string
{
    case NA_FILA = 'na_fila';
    case TRANSCREVENDO = 'transcrevendo';
    case CONCLUIDA = 'concluida';
    case ERRO = 'erro';

    public function descricao(): string
    {
        return match ($this) {
            self::NA_FILA => 'Na fila',
            self::TRANSCREVENDO => 'Transcrevendo',
            self::CONCLUIDA => 'Concluída',
            self::ERRO => 'Erro',
        };
    }

    public function isNaFila(): bool
    {
        return self::NA_FILA === $this;
    }

    public function isTranscrevendo(): bool
    {
        return self::TRANSCREVENDO === $this;
    }

    public function isEmAndamento(): bool
    {
        return self::NA_FILA === $this || self::TRANSCREVENDO === $this;
    }

    public function isConcluida(): bool
    {
        return self::CONCLUIDA === $this;
    }

    public function isErro(): bool
    {
        return self::ERRO === $this;
    }
}
