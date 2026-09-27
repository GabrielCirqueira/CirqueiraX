<?php

declare(strict_types=1);

namespace App\Service\Video;

final class ValidadorUrlPlataforma
{
    /** @var list<string> */
    private const array PADROES_SUPORTADOS = [
        '/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+$/i',
        '/^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/.+$/i',
        '/^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)\/.+$/i',
        '/^https?:\/\/(www\.)?x\.com\/.+\/status\/.+$/i',
        '/^https?:\/\/(www\.)?twitter\.com\/.+\/status\/.+$/i',
    ];

    public function ehUrlSuportada(string $url): bool
    {
        $urlLimpa = trim($url);
        if ('' === $urlLimpa) {
            return false;
        }

        foreach (self::PADROES_SUPORTADOS as $padrao) {
            if (1 === preg_match($padrao, $urlLimpa)) {
                return true;
            }
        }

        return false;
    }
}
