<?php

declare(strict_types=1);

namespace App\Enum;

enum OrigemClassificacao: string
{
    case Regra = 'regra';
    case RegraCanal = 'regra_canal';
    case Ia = 'ia';
    case Manual = 'manual';

    public function descricao(): string
    {
        return match ($this) {
            self::Regra => 'Regra automática',
            self::RegraCanal => 'Regra do canal',
            self::Ia => 'Inteligência artificial',
            self::Manual => 'Correção manual',
        };
    }

    public function isRegra(): bool
    {
        return self::Regra === $this;
    }

    public function isRegraCanal(): bool
    {
        return self::RegraCanal === $this;
    }

    public function isIa(): bool
    {
        return self::Ia === $this;
    }

    public function isManual(): bool
    {
        return self::Manual === $this;
    }
}
