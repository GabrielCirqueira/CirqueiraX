<?php

declare(strict_types=1);

namespace App\DataObject\Musica;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class DescartarDuplicataDTO
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Uuid]
        public string $primeiraUuid,
        #[Assert\NotBlank]
        #[Assert\Uuid]
        public string $segundaUuid,
    ) {
    }
}
