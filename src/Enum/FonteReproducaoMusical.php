<?php

declare(strict_types=1);

namespace App\Enum;

enum FonteReproducaoMusical: string
{
    case Spotify = 'spotify';
    case YoutubeMusic = 'youtube_music';

    public function descricao(): string
    {
        return match ($this) {
            self::Spotify => 'Spotify',
            self::YoutubeMusic => 'YouTube Music',
        };
    }
}
