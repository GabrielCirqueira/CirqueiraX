<?php

declare(strict_types=1);

namespace App\Controller;

use App\DataObject\ClassificarManualDTO;
use App\DataObject\PaginacaoDTO;
use App\Serializer\MediaItemSerializer;
use App\Service\MediaItemService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/media-itens', name: 'api_media_itens_')]
final class MediaItemController extends DefaultController
{
    public function __construct(
        private readonly MediaItemService $mediaItemService,
        private readonly MediaItemSerializer $mediaItemSerializer,
    ) {}

    #[Route('', name: 'listar', methods: ['GET'])]
    public function listar(#[MapQueryString] ?PaginacaoDTO $paginacao = null): Response
    {
        $paginacao ??= new PaginacaoDTO();
        $resultado = $this->mediaItemService->listarPaginado($paginacao->pagina(), $paginacao->limite());

        return $this->paginated(
            $this->mediaItemSerializer->normalizarLista($resultado['itens']),
            $resultado['total'],
            $paginacao->pagina(),
            $paginacao->limite(),
        );
    }

    #[Route('/{uuid}', name: 'detalhar', methods: ['GET'])]
    public function detalhar(string $uuid): Response
    {
        $mediaItem = $this->mediaItemService->buscarPorUuid($uuid);

        return $this->success($this->mediaItemSerializer->normalizar($mediaItem));
    }

    #[Route('/{uuid}/categoria', name: 'classificar_categoria', methods: ['PATCH'])]
    public function classificarCategoria(string $uuid, #[MapRequestPayload] ClassificarManualDTO $dto): Response
    {
        $mediaItem = $this->mediaItemService->classificarManualmente($uuid, $dto);

        return $this->success($this->mediaItemSerializer->normalizar($mediaItem));
    }

    #[Route('/retentar', name: 'retentar_lote', methods: ['POST'])]
    public function retentarLote(): Response
    {
        $itens = $this->mediaItemService->retentarTodosComErro();

        return $this->success($this->mediaItemSerializer->normalizarLista($itens));
    }

    #[Route('/{uuid}/retentar', name: 'retentar_individual', methods: ['POST'])]
    public function retentarIndividual(string $uuid): Response
    {
        $mediaItem = $this->mediaItemService->retentar($uuid);

        return $this->success($this->mediaItemSerializer->normalizar($mediaItem));
    }
}
