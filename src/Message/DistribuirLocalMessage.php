<?php

declare(strict_types=1);

namespace App\Message;

final readonly class DistribuirLocalMessage
{
    public function __construct(
        public string $mediaItemUuid,
    ) {}

    public function mediaItemUuid(): string
    {
        return $this->mediaItemUuid;
    }
}
