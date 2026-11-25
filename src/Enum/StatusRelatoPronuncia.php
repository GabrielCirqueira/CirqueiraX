<?php

declare(strict_types=1);

namespace App\Enum;

enum StatusRelatoPronuncia: string
{
    case Pendente = 'pendente';
    case Sugerido = 'sugerido';
    case Aprovado = 'aprovado';
    case Rejeitado = 'rejeitado';

    public function descricao(): string
    {
        return match ($this) {
            self::Pendente => 'Aguardando análise',
            self::Sugerido => 'IA sugeriu correção',
            self::Aprovado => 'Correção aplicada',
            self::Rejeitado => 'Rejeitado',
        };
    }

    public function isEmAberto(): bool
    {
        return self::Pendente === $this || self::Sugerido === $this;
    }

    /**
     * @return list<self>
     */
    public static function emAberto(): array
    {
        return [self::Pendente, self::Sugerido];
    }
}
