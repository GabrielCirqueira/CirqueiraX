<?php

declare(strict_types=1);

namespace App\DataObject\IdentificacaoMusica;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class ComponenteIdentificadoDTO
{
    /**
     * @param list<string> $artistas
     */
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(max: 255)]
        public string $titulo,
        #[Assert\All([new Assert\NotBlank(), new Assert\Length(max: 255)])]
        public array $artistas,
    ) {
    }
}
