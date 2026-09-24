<?php

declare(strict_types=1);

namespace App\DataObject;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class ClassificarManualDTO
{
    public function __construct(
        #[Assert\NotBlank(message: 'A categoria é obrigatória.')]
        #[Assert\Length(max: 36)]
        public string $categoriaId,
    ) {
    }

    public function categoriaId(): string
    {
        return $this->categoriaId;
    }
}
