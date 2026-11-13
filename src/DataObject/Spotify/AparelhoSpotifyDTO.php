<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class AparelhoSpotifyDTO
{
    public function __construct(
        public string $id,
        public string $nome,
        public string $tipo,
        public bool $ativo,
        public bool $restrito,
    ) {
    }

    public function isDisponivel(): bool
    {
        return !$this->restrito && '' !== $this->id;
    }
}
