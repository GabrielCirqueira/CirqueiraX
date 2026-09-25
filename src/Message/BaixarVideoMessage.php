<?php

declare(strict_types=1);

namespace App\Message;

use App\Enum\OrigemMedia;

final readonly class BaixarVideoMessage
{
    public OrigemMedia $origem;

    public function __construct(
        public string $url,
        OrigemMedia|string $origem = OrigemMedia::BOT_TELEGRAM,
    ) {
        $this->origem = is_string($origem) ? (OrigemMedia::tryFrom($origem) ?? OrigemMedia::BOT_TELEGRAM) : $origem;
    }

    public function url(): string
    {
        return $this->url;
    }

    public function origem(): OrigemMedia
    {
        return $this->origem;
    }
}
