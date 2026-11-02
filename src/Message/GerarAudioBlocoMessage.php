<?php

declare(strict_types=1);

namespace App\Message;

final readonly class GerarAudioBlocoMessage
{
    public function __construct(
        private string $blocoUuid,
    ) {}

    public function blocoUuid(): string
    {
        return $this->blocoUuid;
    }
}
