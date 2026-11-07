<?php

declare(strict_types=1);

namespace App\Enum;

enum TipoPeriodoAnaliseSpotify: string
{
    case Todos = 'todos';
    case Ano = 'ano';
    case Mes = 'mes';
    case Dias = 'dias';
    case Intervalo = 'intervalo';

    public function isTodos(): bool
    {
        return self::Todos === $this;
    }
}
