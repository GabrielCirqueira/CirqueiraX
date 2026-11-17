<?php

declare(strict_types=1);

namespace App\DataObject\Usuario;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class AlterarSenhaDTO
{
    public function __construct(
        #[Assert\NotBlank(message: 'Informe a senha atual.')]
        public string $senhaAtual,
        #[Assert\NotBlank(message: 'Informe a nova senha.')]
        #[Assert\Length(min: 6, minMessage: 'A nova senha deve ter ao menos 6 caracteres.')]
        public string $novaSenha,
        #[Assert\NotBlank(message: 'Confirme a nova senha.')]
        public string $confirmacaoSenha,
    ) {}
}
