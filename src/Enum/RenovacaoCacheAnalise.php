<?php

declare(strict_types=1);

namespace App\Enum;

use DateTimeImmutable;

enum RenovacaoCacheAnalise: string
{
    case Diaria = 'diaria';
    case Mensal = 'mensal';
    case Continua = 'continua';

    public function sufixoChave(DateTimeImmutable $agoraLocal): string
    {
        return match ($this) {
            self::Diaria => $agoraLocal->format('Y-m-d'),
            self::Mensal => $agoraLocal->format('Y-m'),
            self::Continua => '-',
        };
    }
}
