<?php

declare(strict_types=1);

namespace App\Enum;

enum ServicoPlaylist: string
{
    case Spotify = 'spotify';
    case Youtube = 'youtube';

    public function isSpotify(): bool
    {
        return self::Spotify === $this;
    }

    public function isYoutube(): bool
    {
        return self::Youtube === $this;
    }

    public function descricao(): string
    {
        return match ($this) {
            self::Spotify => 'Spotify',
            self::Youtube => 'YouTube Music',
        };
    }
}
