<?php

declare(strict_types=1);

namespace App\Message;

final readonly class SincronizarVinculoPlaylistMessage
{
    public function __construct(
        public string $vinculoUuid,
        public bool $force = false,
    ) {
    }
}
