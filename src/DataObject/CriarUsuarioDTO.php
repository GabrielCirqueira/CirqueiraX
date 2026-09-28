<?php

declare(strict_types=1);

namespace App\DataObject;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class CriarUsuarioDTO
{
    /**
     * @param list<string> $roles
     */
    public function __construct(
        #[Assert\NotBlank(message: 'O nome completo é obrigatório.')]
        #[Assert\Length(min: 3, max: 255, minMessage: 'O nome completo deve ter ao menos 3 caracteres.')]
        public string $nomeCompleto,
        #[Assert\NotBlank(message: 'O nome de usuário é obrigatório.')]
        #[Assert\Length(min: 3, max: 100, minMessage: 'O nome de usuário deve ter ao menos 3 caracteres.')]
        #[Assert\Regex(
            pattern: '/^[a-zA-Z0-9._-]+$/',
            message: 'O usuário só pode conter letras, números, pontos, hífens e underscores.',
        )]
        public string $username,
        #[Assert\NotBlank(message: 'O e-mail é obrigatório.')]
        #[Assert\Email(message: 'Informe um endereço de e-mail válido.')]
        public string $email,
        #[Assert\NotBlank(message: 'A senha é obrigatória.')]
        #[Assert\Length(min: 6, minMessage: 'A senha deve ter ao menos 6 caracteres.')]
        public string $senha,
        public array $roles = ['ROLE_USER'],
    ) {}
}
