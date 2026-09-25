<?php

declare(strict_types=1);

namespace App\DataObject;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class ApagarLoteDTO
{
    /**
     * @param list<string> $uuids
     */
    public function __construct(
        #[Assert\NotBlank(message: 'A lista de UUIDs é obrigatória.')]
        #[Assert\Count(min: 1, minMessage: 'Informe pelo menos um UUID para apagar.')]
        #[Assert\All([
            new Assert\NotBlank(message: 'O UUID não pode ser vazio.'),
            new Assert\Uuid(message: 'O formato do UUID é inválido.'),
        ])]
        public array $uuids,
    ) {
    }

    /**
     * @return list<string>
     */
    public function uuids(): array
    {
        return $this->uuids;
    }
}
