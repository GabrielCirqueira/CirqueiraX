<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class FiltroHistoricoPronunciaDTO
{
    private const int LIMITE_PADRAO = 20;

    public function __construct(
        public ?string $busca = null,
        public bool $favoritas = false,
        #[Assert\Positive(message: 'A página deve ser maior que zero.')]
        public int $pagina = 1,
        #[Assert\Range(min: 1, max: 100, notInRangeMessage: 'O limite deve ficar entre {{ min }} e {{ max }}.')]
        public int $limite = self::LIMITE_PADRAO,
    ) {
    }

    public function busca(): ?string
    {
        $busca = trim((string) $this->busca);

        return '' === $busca ? null : $busca;
    }

    public function isSomenteFavoritas(): bool
    {
        return $this->favoritas;
    }

    public function pagina(): int
    {
        return $this->pagina;
    }

    public function limite(): int
    {
        return $this->limite;
    }
}
