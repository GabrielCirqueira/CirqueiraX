<?php

declare(strict_types=1);

namespace App\DataObject;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class BaixarVideoDTO
{
    public function __construct(
        #[Assert\NotBlank(message: 'A URL do vídeo é obrigatória.')]
        #[Assert\Url(message: 'A URL fornecida é inválida.')]
        public string $url,
        #[Assert\Uuid(message: 'O ID da categoria deve ser um UUID válido.')]
        public ?string $categoriaId = null,
    ) {}

    public function url(): string
    {
        return $this->url;
    }

    public function categoriaId(): ?string
    {
        return $this->categoriaId;
    }
}
