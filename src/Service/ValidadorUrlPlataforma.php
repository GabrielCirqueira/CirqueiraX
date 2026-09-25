<?php

declare(strict_types=1);

namespace App\Service;

use App\Enum\PlataformaVideo;

final readonly class ValidadorUrlPlataforma
{
    public function validar(string $url): bool
    {
        if (false === filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }

        $scheme = parse_url($url, PHP_URL_SCHEME);

        return 'http' === $scheme || 'https' === $scheme;
    }

    public function identificarPlataforma(string $url): PlataformaVideo
    {
        if (!$this->validar($url)) {
            return PlataformaVideo::OUTROS;
        }

        $host = parse_url($url, PHP_URL_HOST);
        if (null === $host || false === $host) {
            return PlataformaVideo::OUTROS;
        }

        $host = strtolower((string) $host);

        if (str_contains($host, 'youtube.com') || str_contains($host, 'youtu.be')) {
            return PlataformaVideo::YOUTUBE;
        }

        if (str_contains($host, 'tiktok.com')) {
            return PlataformaVideo::TIKTOK;
        }

        if (str_contains($host, 'twitter.com') || str_contains($host, 'x.com')) {
            return PlataformaVideo::TWITTER;
        }

        if (str_contains($host, 'instagram.com') || str_contains($host, 'instagr.am')) {
            return PlataformaVideo::INSTAGRAM;
        }

        return PlataformaVideo::OUTROS;
    }
}
