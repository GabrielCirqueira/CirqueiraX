<?php

declare(strict_types=1);

namespace App\Controller\Auth;

use App\Controller\Common\DefaultController;
use App\DataObject\Usuario\AlterarSenhaDTO;
use App\DataObject\Usuario\AtualizarPerfilDTO;
use App\Entity\Usuario;
use App\Serializer\UsuarioSerializer;
use App\Service\Usuario\AlterarSenhaPropriaService;
use App\Service\Usuario\AtualizarPerfilService;
use LogicException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/v1/auth', name: 'auth_')]
final class AuthController extends DefaultController
{
    public function __construct(
        private readonly UsuarioSerializer $usuarioSerializer,
        private readonly AtualizarPerfilService $atualizarPerfil,
        private readonly AlterarSenhaPropriaService $alterarSenha,
    ) {}

    #[Route('/me', name: 'me', methods: ['GET'])]
    public function me(#[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->usuarioSerializer->normalizar($usuario));
    }

    #[Route('/me', name: 'me_atualizar', methods: ['PUT', 'PATCH'])]
    public function atualizarPerfil(
        #[CurrentUser] Usuario $usuario,
        #[MapRequestPayload] AtualizarPerfilDTO $dto,
    ): Response {
        return $this->success(
            $this->usuarioSerializer->normalizar($this->atualizarPerfil->executar($usuario, $dto)),
        );
    }

    #[Route('/me/senha', name: 'me_senha', methods: ['PUT', 'PATCH'])]
    public function alterarSenha(
        #[CurrentUser] Usuario $usuario,
        #[MapRequestPayload] AlterarSenhaDTO $dto,
    ): Response {
        $this->alterarSenha->executar($usuario, $dto);

        return $this->success(['alterado' => true]);
    }

    #[Route('/logout', name: 'logout', methods: ['POST'])]
    public function logout(): never
    {
        throw new LogicException('A saída é tratada pelo firewall.');
    }
}
