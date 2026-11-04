<?php

declare(strict_types=1);

namespace App\Enum;

enum ModoNotasLivroAudio: string
{
    case NORMAL = 'normal';
    case FIM_CAPITULO = 'fim_capitulo';
    case PULAR = 'pular';

    public function descricao(): string
    {
        return match ($this) {
            self::NORMAL => 'Ler normalmente',
            self::FIM_CAPITULO => 'Ler no fim do capítulo',
            self::PULAR => 'Pular notas',
        };
    }

    public function removeMarcadores(): bool
    {
        return self::NORMAL !== $this;
    }
}
