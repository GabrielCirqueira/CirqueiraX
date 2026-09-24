<?php

declare(strict_types=1);

namespace App\Security;

use App\Entity\TokenAgente;
use Symfony\Component\Security\Core\User\UserInterface;

class AgenteUser implements UserInterface
{
    public function __construct(
        private readonly TokenAgente $tokenAgente,
    ) {
    }

    public function tokenAgente(): TokenAgente
    {
        return $this->tokenAgente;
    }

    public function getUserIdentifier(): string
    {
        return $this->tokenAgente->uuid()?->toString() ?? $this->tokenAgente->nome();
    }

    /** @return list<string> */
    public function getRoles(): array
    {
        return ['ROLE_AGENTE'];
    }

    public function eraseCredentials(): void
    {
    }
}
