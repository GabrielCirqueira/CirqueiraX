<?php

declare(strict_types=1);

namespace App\Message;

final readonly class VincularSpotifyAoCatalogoMessage
{
    public function __construct(
        public int $usuarioId,
        public ?int $tocadasDesdeTimestamp = null,
        public ?int $tocadasAteTimestamp = null,
    ) {
    }
}
