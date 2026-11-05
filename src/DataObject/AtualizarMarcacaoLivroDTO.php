<?php

declare(strict_types=1);

namespace App\DataObject;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class AtualizarMarcacaoLivroDTO
{
    public function __construct(
        #[Assert\Length(max: 10000)]
        public ?string $nota = null,
    ) {}

    public function notaLimpa(): ?string
    {
        $nota = null !== $this->nota ? trim($this->nota) : '';

        return '' !== $nota ? $nota : null;
    }
}
