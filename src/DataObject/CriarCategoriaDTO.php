<?php

declare(strict_types=1);

namespace App\DataObject;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class CriarCategoriaDTO
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(max: 100)]
        public string $nome,
        #[Assert\NotBlank]
        #[Assert\Length(max: 255)]
        public string $pastaLocal,
        public ?string $googlePhotosAlbumId = null,
    ) {
    }

    public function nome(): string
    {
        return $this->nome;
    }

    public function pastaLocal(): string
    {
        return $this->pastaLocal;
    }

    public function googlePhotosAlbumId(): ?string
    {
        return $this->googlePhotosAlbumId;
    }
}
