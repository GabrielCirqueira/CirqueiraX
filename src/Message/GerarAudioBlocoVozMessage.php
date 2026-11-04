<?php

declare(strict_types=1);

namespace App\Message;

final readonly class GerarAudioBlocoVozMessage
{
    public function __construct(
        private string $blocoVozUuid,
    ) {}

    public function blocoVozUuid(): string
    {
        return $this->blocoVozUuid;
    }
}
