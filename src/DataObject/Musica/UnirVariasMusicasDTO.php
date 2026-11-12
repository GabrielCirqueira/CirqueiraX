<?php

declare(strict_types=1);

namespace App\DataObject\Musica;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class UnirVariasMusicasDTO
{
    public const int MAXIMO_ORIGENS = 10;

    /**
     * @param list<string> $origemUuids
     */
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Uuid]
        public string $destinoUuid,
        #[Assert\Count(min: 1, max: self::MAXIMO_ORIGENS)]
        #[Assert\All([new Assert\NotBlank(), new Assert\Uuid()])]
        public array $origemUuids = [],
    ) {
    }
}
