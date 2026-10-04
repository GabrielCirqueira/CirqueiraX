<?php

declare(strict_types=1);

namespace App\Controller\Categoria;

use App\Controller\Common\DefaultController;
use App\DataObject\CriarCategoriaDTO;
use App\DataObject\VincularAlbumDTO;
use App\Serializer\CategoriaSerializer;
use App\Service\Categoria\CategoriaService;
use App\Service\Categoria\VincularAlbumCategoriaService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/categorias', name: 'api_categorias_')]
final class CategoriaController extends DefaultController
{
    public function __construct(
        private readonly CategoriaService $categoriaService,
        private readonly CategoriaSerializer $categoriaSerializer,
    ) {}

    #[Route('', name: 'listar', methods: ['GET'])]
    public function listar(): Response
    {
        $categorias = $this->categoriaService->listarTodas();

        return $this->success($this->categoriaSerializer->normalizarLista($categorias));
    }

    #[Route('', name: 'criar', methods: ['POST'])]
    public function criar(#[MapRequestPayload] CriarCategoriaDTO $dto): Response
    {
        $categoria = $this->categoriaService->criar($dto);

        return $this->created($this->categoriaSerializer->normalizar($categoria));
    }

    #[Route('/{uuid}', name: 'detalhar', methods: ['GET'])]
    public function detalhar(string $uuid): Response
    {
        $categoria = $this->categoriaService->buscarPorUuid($uuid);

        return $this->success($this->categoriaSerializer->normalizar($categoria));
    }

    #[Route('/{uuid}', name: 'atualizar', methods: ['PUT', 'PATCH'])]
    public function atualizar(string $uuid, #[MapRequestPayload] CriarCategoriaDTO $dto): Response
    {
        $categoria = $this->categoriaService->atualizar($uuid, $dto);

        return $this->success($this->categoriaSerializer->normalizar($categoria));
    }

    #[Route('/{uuid}/album', name: 'vincular_album', methods: ['PATCH'])]
    public function vincularAlbum(
        string $uuid,
        #[MapRequestPayload] VincularAlbumDTO $dto,
        VincularAlbumCategoriaService $vincularAlbumService,
    ): Response {
        $categoria = $vincularAlbumService->executar($uuid, $dto);

        return $this->success($this->categoriaSerializer->normalizar($categoria));
    }

    #[Route('/{uuid}', name: 'remover', methods: ['DELETE'])]
    public function remover(string $uuid): Response
    {
        $this->categoriaService->remover($uuid);

        return $this->noContent();
    }
}

