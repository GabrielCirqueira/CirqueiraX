<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class SalvarExcecaoPronunciaDTO
{
    public function __construct(
        #[Assert\NotBlank(message: 'Informe a palavra em inglês.')]
        #[Assert\Length(max: 80, maxMessage: 'A palavra pode ter no máximo {{ limit }} caracteres.')]
        public string $palavra = '',
        #[Assert\NotBlank(message: 'Informe a pronúncia figurada.')]
        #[Assert\Length(max: 120, maxMessage: 'A pronúncia pode ter no máximo {{ limit }} caracteres.')]
        public string $pronuncia = '',
        #[Assert\Length(max: 255, maxMessage: 'A observação pode ter no máximo {{ limit }} caracteres.')]
        public ?string $observacao = null,
    ) {
    }

    public function correcao(): CorrecaoPalavraPronunciaDTO
    {
        return new CorrecaoPalavraPronunciaDTO($this->palavra, $this->pronuncia);
    }

    public function observacao(): ?string
    {
        $observacao = trim((string) $this->observacao);

        return '' === $observacao ? null : $observacao;
    }
}
