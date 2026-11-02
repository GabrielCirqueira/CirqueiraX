<?php

declare(strict_types=1);

namespace App\Message;

final readonly class ProcessarLivroAudioMessage
{
    public function __construct(
        private string $livroUuid,
    ) {}

    public function livroUuid(): string
    {
        return $this->livroUuid;
    }
}
