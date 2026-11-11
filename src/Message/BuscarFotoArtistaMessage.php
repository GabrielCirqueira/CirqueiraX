<?php

declare(strict_types=1);

namespace App\Message;

final readonly class BuscarFotoArtistaMessage
{
    public function __construct(
        public int $usuarioId,
        public string $artistaUuid,
    ) {
    }
}
