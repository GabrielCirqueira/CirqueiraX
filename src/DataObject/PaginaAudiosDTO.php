<?php

declare(strict_types=1);

namespace App\DataObject;

use App\Entity\Audio;

final readonly class PaginaAudiosDTO
{
    /**
     * @param list<Audio> $audios
     */
    public function __construct(
        public array $audios,
        public int $total,
    ) {}

    /**
     * @return list<Audio>
     */
    public function audios(): array
    {
        return $this->audios;
    }

    public function total(): int
    {
        return $this->total;
    }
}
