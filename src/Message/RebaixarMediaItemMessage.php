<?php

declare(strict_types=1);

namespace App\Message;

final readonly class RebaixarMediaItemMessage
{
    public function __construct(
        private string $mediaItemUuid,
    ) {}

    public function mediaItemUuid(): string
    {
        return $this->mediaItemUuid;
    }
}
