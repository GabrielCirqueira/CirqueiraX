<?php

declare(strict_types=1);

namespace App\Controller\Auth;

use App\Controller\Common\DefaultController;
use App\Entity\Usuario;
use LogicException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/auth', name: 'auth_')]
final class AuthController extends DefaultController
{
    #[Route('/me', name: 'me', methods: ['GET'])]
    public function me(): Response
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        return $this->success([
            'id' => $usuario->getId(),
            'nomeCompleto' => $usuario->getNomeCompleto(),
            'username' => $usuario->getUsername(),
            'email' => $usuario->getEmail(),
            'roles' => $usuario->getRoles(),
            'criadoEm' => $usuario->getCriadoEm()->format(\DateTimeInterface::ATOM),
        ]);
    }

    #[Route('/logout', name: 'logout', methods: ['POST'])]
    public function logout(): never
    {
        throw new LogicException('A saída é tratada pelo firewall.');
    }
}
