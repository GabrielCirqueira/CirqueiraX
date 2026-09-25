<?php

declare(strict_types=1);

namespace App\Enum;

enum PlataformaVideo: string
{
    case YOUTUBE = 'youtube';
    case TIKTOK = 'tiktok';
    case TWITTER = 'twitter';
    case INSTAGRAM = 'instagram';
    case OUTROS = 'outros';

    public function descricao(): string
    {
        return match ($this) {
            self::YOUTUBE => 'YouTube',
            self::TIKTOK => 'TikTok',
            self::TWITTER => 'Twitter / X',
            self::INSTAGRAM => 'Instagram',
            self::OUTROS => 'Outros',
        };
    }
}
