<?php

declare(strict_types=1);

namespace App\Controller\Categoria;

use App\Controller\Common\DefaultController;
use App\DataObject\CriarCategoriaDTO;
use App\DataObject\VincularAlbumDTO;
use App\Entity\Usuario;
use App\Serializer\CategoriaSerializer;
use App\Service\Categoria\CategoriaService;
use App\Service\Categoria\VincularAlbumCategoriaService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/v1/categorias', name: 'api_categorias_')]
final class CategoriaController extends DefaultController
{
    public function __construct(
        private readonly CategoriaService $categoriaService,
        private readonly CategoriaSerializer $categoriaSerializer,
    ) {}

    #[Route('', name: 'listar', methods: ['GET'])]
    public function listar(#[CurrentUser] Usuario $usuario): Response
    {
        $categorias = $this->categoriaService->listarTodas($usuario);

        return $this->success($this->categoriaSerializer->normalizarLista($categorias));
    }

    #[Route('', name: 'criar', methods: ['POST'])]
    public function criar(#[MapRequestPayload] CriarCategoriaDTO $dto, #[CurrentUser] Usuario $usuario): Response
    {
        $categoria = $this->categoriaService->criar($dto, $usuario);

        return $this->created($this->categoriaSerializer->normalizar($categoria));
    }

    #[Route('/{uuid}', name: 'detalhar', methods: ['GET'])]
    public function detalhar(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        $categoria = $this->categoriaService->buscarDoUsuario($uuid, $usuario);

        return $this->success($this->categoriaSerializer->normalizar($categoria));
    }

    #[Route('/{uuid}', name: 'atualizar', methods: ['PUT', 'PATCH'])]
    public function atualizar(string $uuid, #[MapRequestPayload] CriarCategoriaDTO $dto, #[CurrentUser] Usuario $usuario): Response
    {
        $categoria = $this->categoriaService->atualizar($uuid, $dto, $usuario);

        return $this->success($this->categoriaSerializer->normalizar($categoria));
    }

    #[Route('/{uuid}/album', name: 'vincular_album', methods: ['PATCH'])]
    public function vincularAlbum(
        string $uuid,
        #[MapRequestPayload] VincularAlbumDTO $dto,
        VincularAlbumCategoriaService $vincularAlbumService,
        #[CurrentUser] Usuario $usuario,
    ): Response {
        $categoria = $vincularAlbumService->executar($uuid, $dto, $usuario);

        return $this->success($this->categoriaSerializer->normalizar($categoria));
    }

    #[Route('/{uuid}', name: 'remover', methods: ['DELETE'])]
    public function remover(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        $this->categoriaService->remover($uuid, $usuario);

        return $this->noContent();
    }
}

