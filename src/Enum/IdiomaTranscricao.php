<?php

declare(strict_types=1);

namespace App\Enum;

enum IdiomaTranscricao: string
{
    case AUTOMATICO = 'auto';
    case PORTUGUES = 'pt';
    case INGLES = 'en';
    case ESPANHOL = 'es';

    public function descricao(): string
    {
        return match ($this) {
            self::AUTOMATICO => 'Detectar automaticamente',
            self::PORTUGUES => 'Português',
            self::INGLES => 'Inglês',
            self::ESPANHOL => 'Espanhol',
        };
    }

    public function isAutomatico(): bool
    {
        return self::AUTOMATICO === $this;
    }
}
