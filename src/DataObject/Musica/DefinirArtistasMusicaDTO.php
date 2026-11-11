<?php

declare(strict_types=1);

namespace App\DataObject\Musica;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class DefinirArtistasMusicaDTO
{
    /**
     * @param list<string> $artistas
     */
    public function __construct(
        #[Assert\Count(min: 1, max: 20)]
        #[Assert\All([new Assert\NotBlank(), new Assert\Length(max: 255)])]
        public array $artistas,
    ) {
    }
}
