<?php

declare(strict_types=1);

namespace App\Message;

final readonly class ExecutarTransferenciaPlaylistMessage
{
    public function __construct(
        public string $transferenciaUuid,
    ) {
    }
}
