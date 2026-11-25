<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class FiltroExcecoesPronunciaDTO
{
    public function __construct(
        #[Assert\Length(max: 80, maxMessage: 'A busca pode ter no máximo {{ limit }} caracteres.')]
        public ?string $busca = null,
    ) {
    }

    public function busca(): ?string
    {
        $busca = trim((string) $this->busca);

        return '' === $busca ? null : $busca;
    }
}
