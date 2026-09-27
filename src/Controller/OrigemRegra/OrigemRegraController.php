<?php

declare(strict_types=1);

namespace App\Controller\OrigemRegra;

use App\Controller\Common\DefaultController;
use App\DataObject\CriarOrigemRegraDTO;
use App\Serializer\OrigemRegraSerializer;
use App\Service\OrigemRegra\OrigemRegraService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/origem-regras', name: 'api_origem_regras_')]
final class OrigemRegraController extends DefaultController
{
    public function __construct(
        private readonly OrigemRegraService $origemRegraService,
        private readonly OrigemRegraSerializer $origemRegraSerializer,
    ) {}

    #[Route('', name: 'listar', methods: ['GET'])]
    public function listar(): Response
    {
        $regras = $this->origemRegraService->listarTodas();

        return $this->success($this->origemRegraSerializer->normalizarLista($regras));
    }

    #[Route('', name: 'criar', methods: ['POST'])]
    public function criar(#[MapRequestPayload] CriarOrigemRegraDTO $dto): Response
    {
        $regra = $this->origemRegraService->criar($dto);

        return $this->created($this->origemRegraSerializer->normalizar($regra));
    }

    #[Route('/{uuid}', name: 'detalhar', methods: ['GET'])]
    public function detalhar(string $uuid): Response
    {
        $regra = $this->origemRegraService->buscarPorUuid($uuid);

        return $this->success($this->origemRegraSerializer->normalizar($regra));
    }

    #[Route('/{uuid}', name: 'atualizar', methods: ['PUT'])]
    public function atualizar(string $uuid, #[MapRequestPayload] CriarOrigemRegraDTO $dto): Response
    {
        $regra = $this->origemRegraService->atualizar($uuid, $dto);

        return $this->success($this->origemRegraSerializer->normalizar($regra));
    }

    #[Route('/{uuid}', name: 'remover', methods: ['DELETE'])]
    public function remover(string $uuid): Response
    {
        $this->origemRegraService->remover($uuid);

        return $this->noContent();
    }
}
