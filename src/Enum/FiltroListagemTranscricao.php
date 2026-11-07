<?php

declare(strict_types=1);

namespace App\Enum;

enum FiltroListagemTranscricao: string
{
    case TODAS = 'todas';
    case EM_ANDAMENTO = 'em_andamento';
    case CONCLUIDAS = 'concluidas';
    case FAVORITAS = 'favoritas';
    case COM_ERRO = 'com_erro';

    /**
     * @return list<StatusTranscricao>
     */
    public function statusIncluidos(): array
    {
        return match ($this) {
            self::EM_ANDAMENTO => [StatusTranscricao::NA_FILA, StatusTranscricao::TRANSCREVENDO],
            self::CONCLUIDAS => [StatusTranscricao::CONCLUIDA],
            self::COM_ERRO => [StatusTranscricao::ERRO],
            self::TODAS, self::FAVORITAS => [],
        };
    }

    public function isApenasFavoritas(): bool
    {
        return self::FAVORITAS === $this;
    }
}
