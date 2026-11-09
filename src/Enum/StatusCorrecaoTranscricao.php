<?php

declare(strict_types=1);

namespace App\Enum;

enum StatusCorrecaoTranscricao: string
{
    case NA_FILA = 'na_fila';
    case CORRIGINDO = 'corrigindo';
    case CONCLUIDA = 'concluida';
    case ERRO = 'erro';

    public function descricao(): string
    {
        return match ($this) {
            self::NA_FILA => 'Na fila para correção',
            self::CORRIGINDO => 'Corrigindo com IA',
            self::CONCLUIDA => 'Corrigida com IA',
            self::ERRO => 'Erro na correção',
        };
    }

    public function isEmAndamento(): bool
    {
        return self::NA_FILA === $this || self::CORRIGINDO === $this;
    }
}
