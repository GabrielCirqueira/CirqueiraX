<?php

declare(strict_types=1);

namespace App\DataObject\Usuario;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class AtualizarUsuarioDTO
{
    /**
     * @param list<string>|null $permissoes
     */
    public function __construct(
        #[Assert\NotBlank(message: 'O nome completo é obrigatório.')]
        #[Assert\Length(min: 3, max: 255, minMessage: 'O nome completo deve ter ao menos 3 caracteres.')]
        public string $nomeCompleto,
        #[Assert\NotBlank(message: 'O e-mail é obrigatório.')]
        #[Assert\Email(message: 'Informe um endereço de e-mail válido.')]
        public string $email,
        public bool $administrador = false,
        public ?array $permissoes = null,
        #[Assert\Length(min: 6, minMessage: 'A senha deve ter ao menos 6 caracteres.')]
        public ?string $senha = null,
    ) {}
}
