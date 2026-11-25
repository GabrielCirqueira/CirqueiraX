<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

use App\Enum\DirecaoTraducao;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class TraduzirTextoDTO
{
    public const int TAMANHO_MAXIMO = 3000;

    public function __construct(
        #[Assert\NotBlank(message: 'Digite uma palavra, frase ou texto para traduzir.')]
        #[Assert\Length(max: self::TAMANHO_MAXIMO, maxMessage: 'O texto pode ter no máximo {{ limit }} caracteres.')]
        public string $texto = '',
        public DirecaoTraducao $direcao = DirecaoTraducao::Automatica,
    ) {
    }

    public function texto(): string
    {
        return trim((string) preg_replace('/[ \t]+/u', ' ', $this->texto));
    }

    public function direcao(): DirecaoTraducao
    {
        return $this->direcao;
    }
}
