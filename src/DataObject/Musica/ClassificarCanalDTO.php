<?php

declare(strict_types=1);

namespace App\DataObject\Musica;

use App\Enum\ClassificacaoCanal;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class ClassificarCanalDTO
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(max: 255)]
        public string $canal,
        public ClassificacaoCanal $classificacao,
    ) {
    }
}
