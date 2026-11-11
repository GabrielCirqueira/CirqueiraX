<?php

declare(strict_types=1);

namespace App\Enum;

enum TipoVersaoMusica: string
{
    case Original = 'original';
    case Slowed = 'slowed';
    case SpedUp = 'sped_up';
    case Reverb = 'reverb';
    case OitoD = 'oito_d';
    case Nightcore = 'nightcore';
    case Lyrics = 'lyrics';
    case VideoOficial = 'video_oficial';
    case Traducao = 'traducao';
    case Remix = 'remix';
    case Cover = 'cover';
    case Instrumental = 'instrumental';
    case AoVivo = 'ao_vivo';
    case Outro = 'outro';

    public function descricao(): string
    {
        return match ($this) {
            self::Original => 'Original',
            self::Slowed => 'Slowed',
            self::SpedUp => 'Sped up',
            self::Reverb => 'Reverb',
            self::OitoD => '8D',
            self::Nightcore => 'Nightcore',
            self::Lyrics => 'Lyrics',
            self::VideoOficial => 'Vídeo oficial',
            self::Traducao => 'Tradução',
            self::Remix => 'Remix',
            self::Cover => 'Cover',
            self::Instrumental => 'Instrumental',
            self::AoVivo => 'Ao vivo',
            self::Outro => 'Outra versão',
        };
    }

    public function isOriginal(): bool
    {
        return self::Original === $this;
    }

    public function isSlowed(): bool
    {
        return self::Slowed === $this;
    }

    public function isSpedUp(): bool
    {
        return self::SpedUp === $this;
    }

    public function isReverb(): bool
    {
        return self::Reverb === $this;
    }

    public function isOitoD(): bool
    {
        return self::OitoD === $this;
    }

    public function isNightcore(): bool
    {
        return self::Nightcore === $this;
    }

    public function isLyrics(): bool
    {
        return self::Lyrics === $this;
    }

    public function isVideoOficial(): bool
    {
        return self::VideoOficial === $this;
    }

    public function isTraducao(): bool
    {
        return self::Traducao === $this;
    }

    public function isRemix(): bool
    {
        return self::Remix === $this;
    }

    public function isCover(): bool
    {
        return self::Cover === $this;
    }

    public function isInstrumental(): bool
    {
        return self::Instrumental === $this;
    }

    public function isAoVivo(): bool
    {
        return self::AoVivo === $this;
    }

    public function isOutro(): bool
    {
        return self::Outro === $this;
    }
}
