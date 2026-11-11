<?php

declare(strict_types=1);

namespace App\Enum;

enum FiltroFonteMusica: string
{
    case Todas = 'todas';
    case Spotify = 'spotify';
    case YoutubeMusic = 'youtube_music';

    /**
     * @return list<FonteReproducaoMusical>
     */
    public function fontes(): array
    {
        return match ($this) {
            self::Todas => FonteReproducaoMusical::cases(),
            self::Spotify => [FonteReproducaoMusical::Spotify],
            self::YoutubeMusic => [FonteReproducaoMusical::YoutubeMusic],
        };
    }

    /**
     * @return list<string>
     */
    public function valoresFontes(): array
    {
        return array_map(static fn (FonteReproducaoMusical $fonte): string => $fonte->value, $this->fontes());
    }
}
