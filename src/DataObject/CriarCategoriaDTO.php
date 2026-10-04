<?php

declare(strict_types=1);

namespace App\DataObject;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class CriarCategoriaDTO
{
    public function __construct(
        #[Assert\NotBlank(message: 'O nome da categoria é obrigatório.')]
        #[Assert\Length(max: 100, maxMessage: 'O nome da categoria deve ter no máximo 100 caracteres.')]
        public string $nome,
        #[Assert\NotBlank(message: 'A pasta local é obrigatória.')]
        #[Assert\Length(max: 255, maxMessage: 'A pasta local deve ter no máximo 255 caracteres.')]
        public string $pastaLocal,
        #[Assert\Length(max: 255, maxMessage: 'O ID do álbum no Google Fotos deve ter no máximo 255 caracteres.')]
        public ?string $googlePhotosAlbumId = null,
    ) {}

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
