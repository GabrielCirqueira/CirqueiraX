<?php

declare(strict_types=1);

namespace App\DataObject;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class SalvarPosicaoLivroDTO
{
    public function __construct(
        #[Assert\NotNull(message: 'A página atual é obrigatória.')]
        #[Assert\Positive(message: 'A página atual deve ser maior que zero.')]
        public int $paginaAtual,
        #[Assert\PositiveOrZero(message: 'O bloco atual deve ser maior ou igual a zero.')]
        public ?int $blocoAtual = null,
        #[Assert\PositiveOrZero(message: 'Os segundos no bloco devem ser maiores ou iguais a zero.')]
        public int $segundosNoBloco = 0,
    ) {}

    public function paginaAtual(): int
    {
        return $this->paginaAtual;
    }

    public function blocoAtual(): ?int
    {
        return $this->blocoAtual;
    }

    public function segundosNoBloco(): int
    {
        return $this->segundosNoBloco;
    }
}
