<?php

declare(strict_types=1);

namespace App\Enum;

enum OrigemPronunciaPalavra: string
{
    case Excecao = 'excecao';
    case Dicionario = 'dicionario';
    case Derivada = 'derivada';
    case Aproximada = 'aproximada';

    public function descricao(): string
    {
        return match ($this) {
            self::Excecao => 'Corrigida manualmente',
            self::Dicionario => 'Dicionário',
            self::Derivada => 'Montada a partir de outra palavra',
            self::Aproximada => 'Pronúncia aproximada',
        };
    }

    public function isAproximada(): bool
    {
        return self::Aproximada === $this;
    }
}
