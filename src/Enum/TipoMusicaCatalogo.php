<?php

declare(strict_types=1);

namespace App\Enum;

enum TipoMusicaCatalogo: string
{
    case Original = 'original';
    case Mashup = 'mashup';

    public function descricao(): string
    {
        return match ($this) {
            self::Original => 'Música',
            self::Mashup => 'Mashup',
        };
    }

    public function isOriginal(): bool
    {
        return self::Original === $this;
    }

    public function isMashup(): bool
    {
        return self::Mashup === $this;
    }
}
