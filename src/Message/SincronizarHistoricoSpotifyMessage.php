<?php

declare(strict_types=1);

namespace App\Message;

final readonly class SincronizarHistoricoSpotifyMessage
{
    public function __construct(
        public ?string $contaUuid = null,
    ) {
    }
}

