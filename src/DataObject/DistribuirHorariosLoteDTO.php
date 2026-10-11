<?php

declare(strict_types=1);

namespace App\DataObject;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class DistribuirHorariosLoteDTO
{
    /**
     * @param list<array{uuid: string, data: string}> $itens
     */
    public function __construct(
        #[Assert\NotBlank(message: 'A lista de itens para distribuição é obrigatória.')]
        #[Assert\Count(min: 1, minMessage: 'Informe pelo menos um item para distribuir o horário.')]
        public array $itens,
    ) {}

    /**
     * @return list<array{uuid: string, data: string}>
     */
    public function itens(): array
    {
        return $this->itens;
    }
}
