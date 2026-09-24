<?php

declare(strict_types=1);

namespace App\DataObject;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class PaginacaoDTO
{
    public function __construct(
        #[Assert\Positive(message: 'A página deve ser maior ou igual a 1.')]
        public int $pagina = 1,
        #[Assert\Range(min: 1, max: 100, notInRangeMessage: 'O limite por página deve estar entre 1 e 100.')]
        public int $limite = 20,
    ) {
    }

    public function pagina(): int
    {
        return max(1, $this->pagina);
    }

    public function limite(): int
    {
        return max(1, min(100, $this->limite));
    }
}
