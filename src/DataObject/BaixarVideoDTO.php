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
    ) {}

    public function url(): string
    {
        return $this->url;
    }
}
