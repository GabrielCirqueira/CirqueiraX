<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

use App\Enum\TipoErroPronuncia;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class ReportarErroPronunciaDTO
{
    public function __construct(
        public TipoErroPronuncia $tipo = TipoErroPronuncia::Pronuncia,
        #[Assert\Length(max: 80, maxMessage: 'A palavra pode ter no máximo {{ limit }} caracteres.')]
        public ?string $palavra = null,
        #[Assert\Length(max: 500, maxMessage: 'O comentário pode ter no máximo {{ limit }} caracteres.')]
        public ?string $comentario = null,
    ) {
    }

    public function tipo(): TipoErroPronuncia
    {
        return $this->tipo;
    }

    public function palavra(): ?string
    {
        $palavra = mb_strtolower(trim((string) $this->palavra));

        return '' === $palavra ? null : $palavra;
    }

    public function comentario(): ?string
    {
        $comentario = trim((string) $this->comentario);

        return '' === $comentario ? null : $comentario;
    }
}
