<?php

declare(strict_types=1);

namespace App\DataObject;

use App\Enum\StatusEnvioGoogleFotos;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class FiltroEnviosGoogleFotosDTO
{
    private const int LIMITE_MAXIMO = 100;

    public function __construct(
        #[Assert\Positive(message: 'A página deve ser maior ou igual a 1.')]
        public int $pagina = 1,
        #[Assert\Range(min: 1, max: 100, notInRangeMessage: 'O limite por página deve estar entre 1 e 100.')]
        public int $limite = 15,
        #[Assert\Choice(callback: [StatusEnvioGoogleFotos::class, 'values'], message: 'Status de envio inválido.')]
        public ?string $status = null,
    ) {}

    public function pagina(): int
    {
        return max(1, $this->pagina);
    }

    public function limite(): int
    {
        return max(1, min(self::LIMITE_MAXIMO, $this->limite));
    }

    public function status(): ?StatusEnvioGoogleFotos
    {
        return null === $this->status ? null : StatusEnvioGoogleFotos::tryFrom($this->status);
    }
}
