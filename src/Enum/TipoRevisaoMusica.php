<?php

declare(strict_types=1);

namespace App\Enum;

enum TipoRevisaoMusica: string
{
    case SemVinculo = 'sem_vinculo';
    case Ambiguo = 'ambiguo';
    case Compilacao = 'compilacao';
    case CanalNovo = 'canal_novo';
    case PossivelDuplicata = 'possivel_duplicata';
    case Indisponivel = 'indisponivel';

    public function descricao(): string
    {
        return match ($this) {
            self::SemVinculo => 'Sem música definida',
            self::Ambiguo => 'Título ambíguo',
            self::Compilacao => 'Compilação',
            self::CanalNovo => 'Canal sem regra',
            self::PossivelDuplicata => 'Possível duplicata',
            self::Indisponivel => 'Vídeo indisponível',
        };
    }
}
