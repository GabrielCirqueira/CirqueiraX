<?php

declare(strict_types=1);

namespace App\Enum;

enum TipoImagemSpotify: string
{
    case Faixa = 'faixa';
    case Artista = 'artista';

    public function isFaixa(): bool
    {
        return self::Faixa === $this;
    }

    public function isArtista(): bool
    {
        return self::Artista === $this;
    }

    public function descricao(): string
    {
        return match ($this) {
            self::Faixa => 'Capa de Faixa',
            self::Artista => 'Foto de Artista',
        };
    }
}

