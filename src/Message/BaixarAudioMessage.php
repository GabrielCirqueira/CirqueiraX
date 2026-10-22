<?php

declare(strict_types=1);

namespace App\Message;

final readonly class BaixarAudioMessage
{
    public function __construct(
        private string $audioUuid,
    ) {}

    public function audioUuid(): string
    {
        return $this->audioUuid;
    }
}
