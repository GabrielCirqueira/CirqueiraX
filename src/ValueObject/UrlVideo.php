<?php

declare(strict_types=1);

namespace App\ValueObject;

use App\Exception\Video\YtDlpException;

final readonly class UrlVideo
{
    private string $url;

    public function __construct(string $url)
    {
        $urlLimpa = trim($url);
        if ('' === $urlLimpa || false === filter_var($urlLimpa, FILTER_VALIDATE_URL)) {
            throw YtDlpException::urlInvalidaOuNaoSuportada($url);
        }

        $this->url = $urlLimpa;
    }

    public function valor(): string
    {
        return $this->url;
    }

    public function __toString(): string
    {
        return $this->url;
    }
}
