<?php

declare(strict_types=1);

namespace App\Enum;

enum ModoSincronizacaoPlaylist: string
{
    case SpotifyParaYoutube = 'spotify_para_youtube';
    case YoutubeParaSpotify = 'youtube_para_spotify';
    case Bidirecional = 'bidirecional';

    public function isSpotifyParaYoutube(): bool
    {
        return self::SpotifyParaYoutube === $this;
    }

    public function isYoutubeParaSpotify(): bool
    {
        return self::YoutubeParaSpotify === $this;
    }

    public function isBidirecional(): bool
    {
        return self::Bidirecional === $this;
    }

    public function descricao(): string
    {
        return match ($this) {
            self::SpotifyParaYoutube => 'Spotify para YouTube',
            self::YoutubeParaSpotify => 'YouTube para Spotify',
            self::Bidirecional => 'Bidirecional',
        };
    }
}
