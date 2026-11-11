<?php

declare(strict_types=1);

namespace App\DataObject\Musica;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class SepararMusicaDTO
{
    public function __construct(
        #[Assert\Uuid]
        public ?string $musicaUuid = null,
        #[Assert\Uuid]
        public ?string $videoUuid = null,
    ) {
    }
}
