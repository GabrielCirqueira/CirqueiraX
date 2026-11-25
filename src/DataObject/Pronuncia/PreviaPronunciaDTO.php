<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class PreviaPronunciaDTO
{
    public function __construct(
        #[Assert\NotBlank(message: 'Digite um texto em inglês.')]
        #[Assert\Length(max: TraduzirTextoDTO::TAMANHO_MAXIMO, maxMessage: 'O texto pode ter no máximo {{ limit }} caracteres.')]
        public string $texto = '',
    ) {
    }

    public function texto(): string
    {
        return trim($this->texto);
    }
}
