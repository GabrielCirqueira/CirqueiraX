<?php

declare(strict_types=1);

namespace App\Controller\MediaItem;

use App\Controller\Common\DefaultController;
use App\DataObject\ApagarLoteDTO;
use App\DataObject\AtualizarMetadataMediaItemDTO;
use App\DataObject\CategorizarLoteDTO;
use App\DataObject\ClassificarManualDTO;
use App\DataObject\FiltrarMediaItemDTO;
use App\DataObject\RebaixarLoteDTO;
use App\DataObject\UploadManualDTO;
use App\Serializer\MediaItemSerializer;
use App\Service\MediaItem\ApagarMediaItemService;
use App\Service\MediaItem\AtualizarMetadataMediaItemService;
use App\Service\MediaItem\ClassificarMediaItemService;
use App\Service\MediaItem\MediaItemService;
use App\Service\MediaItem\RebaixarMediaItemService;
use App\Service\MediaItem\RetentarMediaItemService;
use App\Service\MediaItem\UploadManualService;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/v1/media-itens', name: 'api_media_itens_')]
final class MediaItemController extends DefaultController
{
    public function __construct(
        private readonly MediaItemService $mediaItemService,
        private readonly ClassificarMediaItemService $classificarMediaItemService,
        private readonly ApagarMediaItemService $apagarMediaItemService,
        private readonly RebaixarMediaItemService $rebaixarMediaItemService,
        private readonly RetentarMediaItemService $retentarMediaItemService,
        private readonly AtualizarMetadataMediaItemService $atualizarMetadataMediaItemService,
        private readonly UploadManualService $uploadManualService,
        private readonly MediaItemSerializer $mediaItemSerializer,
    ) {}

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

    #[Route('/upload', name: 'upload_manual', methods: ['POST'])]
    public function uploadManual(
        Request $request,
        ValidatorInterface $validator,
    ): Response {
        $dto = UploadManualDTO::fromRequest($request);
        $violacoes = $validator->validate($dto);

        if (count($violacoes) > 0) {
            $detalhes = [];
            foreach ($violacoes as $violacao) {
                $detalhes[$violacao->getPropertyPath()] = (string) $violacao->getMessage();
            }

            return $this->unprocessable('dados_invalidos', $detalhes);
        }

        $resultado = $this->uploadManualService->executar($dto);
        $data = $this->mediaItemSerializer->normalizar($resultado->mediaItem());
        if ($resultado->ehDuplicado()) {
            $data['_warning'] = 'item_duplicado_existente';
        }

        return $this->created($data);
    }

    #[Route('/lote/categorizar', name: 'categorizar_lote', methods: ['POST'])]
    public function categorizarLote(#[MapRequestPayload] CategorizarLoteDTO $dto): Response
    {
        $itens = $this->classificarMediaItemService->classificarEmLote($dto);

        return $this->success($this->mediaItemSerializer->normalizarLista($itens));
    }

    #[Route('/lote/rebaixar', name: 'rebaixar_lote', methods: ['POST'])]
    public function rebaixarLote(#[MapRequestPayload] RebaixarLoteDTO $dto): Response
    {
        $itens = $this->rebaixarMediaItemService->rebaixarEmLote($dto);

        return $this->success($this->mediaItemSerializer->normalizarLista($itens));
    }

    #[Route('/lote/apagar', name: 'apagar_lote', methods: ['POST'])]
    public function apagarLote(#[MapRequestPayload] ApagarLoteDTO $dto): Response
    {
        $resultado = $this->apagarMediaItemService->apagarEmLote($dto);

        return $this->success($resultado);
    }

    #[Route('/retentar', name: 'retentar_lote', methods: ['POST'])]
    public function retentarLote(): Response
    {
        $itens = $this->retentarMediaItemService->retentarTodosComErro();

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
        $mediaItem = $this->atualizarMetadataMediaItemService->atualizarMetadata($uuid, $dto);

        return $this->success($this->mediaItemSerializer->normalizar($mediaItem));
    }

    #[Route('/{uuid}/categoria', name: 'classificar_categoria', methods: ['PATCH'])]
    public function classificarCategoria(string $uuid, #[MapRequestPayload] ClassificarManualDTO $dto): Response
    {
        $mediaItem = $this->classificarMediaItemService->classificarManualmente($uuid, $dto);

        return $this->success($this->mediaItemSerializer->normalizar($mediaItem));
    }

    #[Route('/{uuid}/retentar', name: 'retentar_individual', methods: ['POST'])]
    public function retentarIndividual(string $uuid): Response
    {
        $mediaItem = $this->retentarMediaItemService->retentar($uuid);

        return $this->success($this->mediaItemSerializer->normalizar($mediaItem));
    }

    #[Route('/{uuid}/stream', name: 'stream', methods: ['GET'])]
    public function streamArquivo(string $uuid): Response
    {
        $mediaItem = $this->mediaItemService->buscarPorUuid($uuid);
        $caminho = (string) $mediaItem->caminhoLocal();

        if ('' === trim($caminho) || !file_exists($caminho)) {
            return $this->error('Arquivo de mídia físico não encontrado no servidor.', Response::HTTP_NOT_FOUND);
        }

        $response = new \Symfony\Component\HttpFoundation\BinaryFileResponse($caminho);
        $response->setAutoEtag();
        $response->headers->set('Accept-Ranges', 'bytes');

        $mimeType = @mime_content_type($caminho) ?: 'application/octet-stream';
        $response->headers->set('Content-Type', $mimeType);
        $response->setContentDisposition(
            \Symfony\Component\HttpFoundation\ResponseHeaderBag::DISPOSITION_INLINE,
            basename($caminho)
        );

        return $response;
    }

    #[Route('/{uuid}/download', name: 'download_arquivo', methods: ['GET'])]
    public function baixarArquivo(string $uuid): Response
    {
        $mediaItem = $this->mediaItemService->buscarPorUuid($uuid);
        $caminho = (string) $mediaItem->caminhoLocal();

        if ('' === trim($caminho) || !file_exists($caminho)) {
            return $this->error('Arquivo de mídia físico não encontrado no servidor.', Response::HTTP_NOT_FOUND);
        }

        $response = new \Symfony\Component\HttpFoundation\BinaryFileResponse($caminho);
        $metadata = $mediaItem->metadata();
        $titulo = (string) ($metadata['titulo'] ?? 'video_' . $mediaItem->hash());
        $ext = (string) ($metadata['extensao'] ?? pathinfo($caminho, PATHINFO_EXTENSION) ?: 'mp4');

        $nomeLimpo = preg_replace('/[^\w\s\-_.]/u', '', $titulo) ?: 'video_' . $mediaItem->hash();
        $nomeArquivo = sprintf('%s.%s', trim($nomeLimpo), $ext);

        $response->setContentDisposition(
            \Symfony\Component\HttpFoundation\ResponseHeaderBag::DISPOSITION_ATTACHMENT,
            $nomeArquivo
        );

        return $response;
    }
}
