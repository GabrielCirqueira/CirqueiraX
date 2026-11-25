<?php

declare(strict_types=1);

namespace App\Enum;

enum DirecaoTraducao: string
{
    case Automatica = 'auto';
    case PortuguesParaIngles = 'pt_en';
    case InglesParaPortugues = 'en_pt';

    public function idiomaOrigemFixo(): ?IdiomaFrase
    {
        return match ($this) {
            self::Automatica => null,
            self::PortuguesParaIngles => IdiomaFrase::Portugues,
            self::InglesParaPortugues => IdiomaFrase::Ingles,
        };
    }

    public function isAutomatica(): bool
    {
        return self::Automatica === $this;
    }

    public function isCompativelCom(IdiomaFrase $idiomaOrigem): bool
    {
        return $this->isAutomatica() || $this->idiomaOrigemFixo() === $idiomaOrigem;
    }
}
