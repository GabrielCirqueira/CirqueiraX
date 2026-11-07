<?php

declare(strict_types=1);

namespace App\Message;

final readonly class TranscreverAudioMessage
{
    public function __construct(
        public string $transcricaoUuid,
    ) {}
}
