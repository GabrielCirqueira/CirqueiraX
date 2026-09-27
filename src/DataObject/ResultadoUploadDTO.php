<?php

declare(strict_types=1);

namespace App\DataObject;

use App\Entity\MediaItem;

final readonly class ResultadoUploadDTO
{
    public function __construct(
        public MediaItem $mediaItem,
        public bool $duplicado = false,
    ) {}

    public function mediaItem(): MediaItem
    {
        return $this->mediaItem;
    }

    public function ehDuplicado(): bool
    {
        return $this->duplicado;
    }
}
