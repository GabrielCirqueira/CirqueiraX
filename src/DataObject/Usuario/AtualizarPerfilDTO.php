<?php

declare(strict_types=1);

namespace App\DataObject\Usuario;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class AtualizarPerfilDTO
{
    public function __construct(
        #[Assert\NotBlank(message: 'O nome completo é obrigatório.')]
        #[Assert\Length(min: 3, max: 255, minMessage: 'O nome completo deve ter ao menos 3 caracteres.')]
        public string $nomeCompleto,
        #[Assert\NotBlank(message: 'O e-mail é obrigatório.')]
        #[Assert\Email(message: 'Informe um endereço de e-mail válido.')]
        public string $email,
    ) {}
}
