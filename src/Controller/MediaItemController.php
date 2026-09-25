<?php

declare(strict_types=1);

namespace App\Controller;

use App\DataObject\ApagarLoteDTO;
use App\DataObject\AtualizarMetadataMediaItemDTO;
use App\DataObject\CategorizarLoteDTO;
use App\DataObject\ClassificarManualDTO;
use App\DataObject\FiltrarMediaItemDTO;
use App\DataObject\RebaixarLoteDTO;
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
    ) {
    }

    #[Route('', name: 'listar', methods: ['GET'])]
    public function listar(#[MapQueryString] ?FiltrarMediaItemDTO $filtro = null): Response
    {
        $filtro ??= new FiltrarMediaItemDTO();
        $resultado = $this->mediaItemService->paginarComFiltros(
            $filtro->paraFiltros(),
            $filtro->pagina(),
            $filtro->porPagina(),
        );

        return $this->paginated(
            $this->mediaItemSerializer->normalizarLista($resultado['itens']),
            $resultado['total'],
            $filtro->pagina(),
            $filtro->porPagina(),
        );
    }

    #[Route('/lote/categorizar', name: 'categorizar_lote', methods: ['POST'])]
    public function categorizarLote(#[MapRequestPayload] CategorizarLoteDTO $dto): Response
    {
        $itens = $this->mediaItemService->classificarEmLote($dto);

        return $this->success($this->mediaItemSerializer->normalizarLista($itens));
    }

    #[Route('/lote/rebaixar', name: 'rebaixar_lote', methods: ['POST'])]
    public function rebaixarLote(#[MapRequestPayload] RebaixarLoteDTO $dto): Response
    {
        $itens = $this->mediaItemService->rebaixarEmLote($dto);

        return $this->success($this->mediaItemSerializer->normalizarLista($itens));
    }

    #[Route('/lote/apagar', name: 'apagar_lote', methods: ['POST'])]
    public function apagarLote(#[MapRequestPayload] ApagarLoteDTO $dto): Response
    {
        $removidos = $this->mediaItemService->apagarEmLote($dto);

        return $this->success([
            'removidos' => $removidos,
            'total' => count($removidos),
        ]);
    }

    #[Route('/retentar', name: 'retentar_lote', methods: ['POST'])]
    public function retentarLote(): Response
    {
        $itens = $this->mediaItemService->retentarTodosComErro();

        return $this->success($this->mediaItemSerializer->normalizarLista($itens));
    }

    #[Route('/{uuid}', name: 'detalhar', methods: ['GET'])]
    public function detalhar(string $uuid): Response
    {
        $mediaItem = $this->mediaItemService->buscarPorUuid($uuid);

        return $this->success($this->mediaItemSerializer->normalizar($mediaItem));
    }

    #[Route('/{uuid}', name: 'atualizar_metadata', methods: ['PATCH'])]
    public function atualizarMetadata(string $uuid, #[MapRequestPayload] AtualizarMetadataMediaItemDTO $dto): Response
    {
        $mediaItem = $this->mediaItemService->atualizarMetadata($uuid, $dto);

        return $this->success($this->mediaItemSerializer->normalizar($mediaItem));
    }

    #[Route('/{uuid}/categoria', name: 'classificar_categoria', methods: ['PATCH'])]
    public function classificarCategoria(string $uuid, #[MapRequestPayload] ClassificarManualDTO $dto): Response
    {
        $mediaItem = $this->mediaItemService->classificarManualmente($uuid, $dto);

        return $this->success($this->mediaItemSerializer->normalizar($mediaItem));
    }

    #[Route('/{uuid}/retentar', name: 'retentar_individual', methods: ['POST'])]
    public function retentarIndividual(string $uuid): Response
    {
        $mediaItem = $this->mediaItemService->retentar($uuid);

        return $this->success($this->mediaItemSerializer->normalizar($mediaItem));
    }
}
