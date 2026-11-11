<?php

declare(strict_types=1);

namespace App\DataObject\Musica;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class BuscaCatalogoMusicaDTO
{
    public const int LIMITE_PADRAO = 10;
    public const int LIMITE_MAXIMO = 30;

    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(min: 2, max: 255)]
        public string $busca = '',
        #[Assert\Range(min: 1, max: self::LIMITE_MAXIMO)]
        public int $limite = self::LIMITE_PADRAO,
    ) {
    }
}
