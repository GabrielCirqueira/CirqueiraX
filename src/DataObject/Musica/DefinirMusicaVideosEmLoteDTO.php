<?php

declare(strict_types=1);

namespace App\DataObject\Musica;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class DefinirMusicaVideosEmLoteDTO
{
    public const int LIMITE_VIDEOS = 100;

    /**
     * @param list<string> $videoUuids
     */
    public function __construct(
        #[Assert\Count(min: 1, max: self::LIMITE_VIDEOS)]
        #[Assert\All([new Assert\NotBlank(), new Assert\Uuid()])]
        public array $videoUuids,
        #[Assert\NotBlank]
        #[Assert\Uuid]
        public string $musicaUuid,
    ) {
    }
}
