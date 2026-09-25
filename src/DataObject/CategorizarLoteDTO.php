<?php

declare(strict_types=1);

namespace App\DataObject;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class CategorizarLoteDTO
{
    /**
     * @param list<string> $uuids
     */
    public function __construct(
        #[Assert\NotBlank(message: 'A lista de UUIDs é obrigatória.')]
        #[Assert\Count(min: 1, minMessage: 'Informe pelo menos um UUID para categorizar.')]
        #[Assert\All([
            new Assert\NotBlank(message: 'O UUID não pode ser vazio.'),
            new Assert\Uuid(message: 'O formato do UUID é inválido.'),
        ])]
        public array $uuids,
        #[Assert\NotBlank(message: 'O identificador da categoria é obrigatório.')]
        #[Assert\Uuid(message: 'O formato do UUID da categoria é inválido.')]
        public string $categoriaId,
    ) {
    }

    /**
     * @return list<string>
     */
    public function uuids(): array
    {
        return $this->uuids;
    }

    public function categoriaId(): string
    {
        return $this->categoriaId;
    }
}
