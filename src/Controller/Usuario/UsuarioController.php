<?php

declare(strict_types=1);

namespace App\Controller\Usuario;

use App\Controller\Common\DefaultController;
use App\DataObject\Usuario\AtualizarUsuarioDTO;
use App\DataObject\Usuario\CadastrarUsuarioDTO;
use App\Entity\Usuario;
use App\Serializer\UsuarioSerializer;
use App\Service\Usuario\AtualizarUsuarioService;
use App\Service\Usuario\CadastrarUsuarioService;
use App\Service\Usuario\ListarFuncionalidadesSistemaService;
use App\Service\Usuario\ListarUsuariosService;
use App\Service\Usuario\ObterUsuarioService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/v1/usuarios')]
#[IsGranted('ROLE_ADMIN')]
final class UsuarioController extends DefaultController
{
    public function __construct(
        private readonly ListarUsuariosService $listarUsuarios,
        private readonly ObterUsuarioService $obterUsuario,
        private readonly CadastrarUsuarioService $cadastrarUsuario,
        private readonly AtualizarUsuarioService $atualizarUsuario,
        private readonly ListarFuncionalidadesSistemaService $listarFuncionalidades,
        private readonly UsuarioSerializer $serializer,
    ) {}

    #[Route('', name: 'api_usuarios_listar', methods: ['GET'])]
    public function listar(): Response
    {
        return $this->success($this->serializer->normalizarLista($this->listarUsuarios->executar()));
    }

    #[Route('/funcionalidades', name: 'api_usuarios_funcionalidades', methods: ['GET'])]
    public function funcionalidades(): Response
    {
        return $this->success($this->listarFuncionalidades->executar());
    }

    #[Route('/{id<\d+>}', name: 'api_usuarios_obter', methods: ['GET'])]
    public function obter(int $id): Response
    {
        return $this->success($this->serializer->normalizar($this->obterUsuario->executar($id)));
    }

    #[Route('', name: 'api_usuarios_cadastrar', methods: ['POST'])]
    public function cadastrar(#[MapRequestPayload] CadastrarUsuarioDTO $dto): Response
    {
        return $this->created($this->serializer->normalizar($this->cadastrarUsuario->executar($dto)));
    }

    #[Route('/{id<\d+>}', name: 'api_usuarios_atualizar', methods: ['PUT', 'PATCH'])]
    public function atualizar(
        int $id,
        #[MapRequestPayload] AtualizarUsuarioDTO $dto,
        #[CurrentUser] Usuario $ator,
    ): Response {
        return $this->success($this->serializer->normalizar($this->atualizarUsuario->executar($id, $dto, $ator)));
    }
}
