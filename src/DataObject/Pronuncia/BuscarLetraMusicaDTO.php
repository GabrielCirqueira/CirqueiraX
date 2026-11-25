<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class BuscarLetraMusicaDTO
{
    public function __construct(
        #[Assert\NotBlank(message: 'Informe a música.')]
        #[Assert\Length(max: 64)]
        public string $codigoFaixa = '',
        #[Assert\NotBlank(message: 'Informe o nome da música.')]
        #[Assert\Length(max: 255)]
        public string $titulo = '',
        #[Assert\NotBlank(message: 'Informe o artista.')]
        #[Assert\Length(max: 255)]
        public string $artista = '',
        #[Assert\Length(max: 255)]
        public ?string $album = null,
        #[Assert\PositiveOrZero]
        public int $duracaoMs = 0,
    ) {
    }

    public function album(): ?string
    {
        $album = trim((string) $this->album);

        return '' === $album ? null : $album;
    }
}
