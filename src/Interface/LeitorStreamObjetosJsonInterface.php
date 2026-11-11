<?php

declare(strict_types=1);

namespace App\Interface;

use Generator;

interface LeitorStreamObjetosJsonInterface
{
    /**
     * @param resource $stream
     *
     * @return Generator<int, array<string, mixed>>
     */
    public function ler($stream): Generator;
}
