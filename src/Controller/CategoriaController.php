<?php

declare(strict_types=1);

namespace App\Controller;

use App\DataObject\AtualizarCategoriaDTO;
use App\DataObject\CriarCategoriaDTO;
use App\DataObject\PaginacaoDTO;
use App\Serializer\CategoriaSerializer;
use App\Service\CategoriaService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/categorias', name: 'api_categorias_')]
final class CategoriaController extends DefaultController
{
    public function __construct(
        private readonly CategoriaService $categoriaService,
        private readonly CategoriaSerializer $categoriaSerializer,
    ) {
    }

    #[Route('', name: 'listar', methods: ['GET'])]
    public function listar(#[MapQueryString] ?PaginacaoDTO $paginacao = null): Response
    {
        $paginacao ??= new PaginacaoDTO();
        $resultado = $this->categoriaService->listarPaginado($paginacao->pagina(), $paginacao->limite());

        return $this->paginated(
            $this->categoriaSerializer->normalizarLista($resultado['itens']),
            $resultado['total'],
            $paginacao->pagina(),
            $paginacao->limite(),
        );
    }

    #[Route('/{uuid}', name: 'detalhar', methods: ['GET'])]
    public function detalhar(string $uuid): Response
    {
        $categoria = $this->categoriaService->buscarPorUuid($uuid);

        return $this->success($this->categoriaSerializer->normalizar($categoria));
    }

    #[Route('', name: 'criar', methods: ['POST'])]
    public function criar(#[MapRequestPayload] CriarCategoriaDTO $dto): Response
    {
        $categoria = $this->categoriaService->criar($dto);

        return $this->created($this->categoriaSerializer->normalizar($categoria));
    }

    #[Route('/{uuid}', name: 'atualizar', methods: ['PATCH'])]
    public function atualizar(string $uuid, #[MapRequestPayload] AtualizarCategoriaDTO $dto): Response
    {
        $categoria = $this->categoriaService->atualizar($uuid, $dto);

        return $this->success($this->categoriaSerializer->normalizar($categoria));
    }

    #[Route('/{uuid}', name: 'remover', methods: ['DELETE'])]
    public function remover(string $uuid): Response
    {
        $this->categoriaService->remover($uuid);

        return $this->noContent();
    }
}
