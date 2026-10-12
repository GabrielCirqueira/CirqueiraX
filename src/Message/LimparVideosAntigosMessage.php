<?php

declare(strict_types=1);

namespace App\Message;

final readonly class LimparVideosAntigosMessage
{
    public function __construct(
        private int $dias = 7,
    ) {}

    public function dias(): int
    {
        return $this->dias;
    }
}
