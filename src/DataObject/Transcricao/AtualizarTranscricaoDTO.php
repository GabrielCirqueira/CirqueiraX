<?php

declare(strict_types=1);

namespace App\DataObject\Transcricao;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class AtualizarTranscricaoDTO
{
    public function __construct(
        #[Assert\Length(
            min: 1,
            max: 255,
            minMessage: 'O título não pode ficar vazio.',
            maxMessage: 'O título deve ter no máximo 255 caracteres.'
        )]
        public ?string $titulo = null,
        public ?bool $favorita = null,
    ) {}

    public function titulo(): ?string
    {
        return null === $this->titulo ? null : trim($this->titulo);
    }

    public function favorita(): ?bool
    {
        return $this->favorita;
    }
}
