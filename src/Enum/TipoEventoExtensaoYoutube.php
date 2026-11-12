<?php

declare(strict_types=1);

namespace App\Enum;

enum TipoEventoExtensaoYoutube: string
{
    case Inicio = 'inicio';
    case Progresso = 'progresso';
    case Fim = 'fim';

    public function isFim(): bool
    {
        return self::Fim === $this;
    }
}
