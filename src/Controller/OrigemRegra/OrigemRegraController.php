<?php

declare(strict_types=1);

namespace App\Controller\OrigemRegra;

use App\Controller\Common\DefaultController;
use App\DataObject\CriarOrigemRegraDTO;
use App\Entity\Usuario;
use App\Serializer\OrigemRegraSerializer;
use App\Service\OrigemRegra\OrigemRegraService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/v1/origem-regras', name: 'api_origem_regras_')]
final class OrigemRegraController extends DefaultController
{
    public function __construct(
        private readonly OrigemRegraService $origemRegraService,
        private readonly OrigemRegraSerializer $origemRegraSerializer,
    ) {}

    #[Route('', name: 'listar', methods: ['GET'])]
    public function listar(#[CurrentUser] Usuario $usuario): Response
    {
        $regras = $this->origemRegraService->listarTodas($usuario);

        return $this->success($this->origemRegraSerializer->normalizarLista($regras));
    }

    #[Route('', name: 'criar', methods: ['POST'])]
    public function criar(#[MapRequestPayload] CriarOrigemRegraDTO $dto, #[CurrentUser] Usuario $usuario): Response
    {
        $regra = $this->origemRegraService->criar($dto, $usuario);

        return $this->created($this->origemRegraSerializer->normalizar($regra));
    }

    #[Route('/{uuid}', name: 'detalhar', methods: ['GET'])]
    public function detalhar(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        $regra = $this->origemRegraService->buscarDoUsuario($uuid, $usuario);

        return $this->success($this->origemRegraSerializer->normalizar($regra));
    }

    #[Route('/{uuid}', name: 'atualizar', methods: ['PUT'])]
    public function atualizar(string $uuid, #[MapRequestPayload] CriarOrigemRegraDTO $dto, #[CurrentUser] Usuario $usuario): Response
    {
        $regra = $this->origemRegraService->atualizar($uuid, $dto, $usuario);

        return $this->success($this->origemRegraSerializer->normalizar($regra));
    }

    #[Route('/{uuid}', name: 'remover', methods: ['DELETE'])]
    public function remover(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        $this->origemRegraService->remover($uuid, $usuario);

        return $this->noContent();
    }
}
