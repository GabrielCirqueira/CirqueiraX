<?php

declare(strict_types=1);

namespace App\Controller\MediaItem;

use App\Controller\Common\DefaultController;
use App\DataObject\ApagarLoteDTO;
use App\DataObject\AtualizarMetadataMediaItemDTO;
use App\DataObject\CategorizarLoteDTO;
use App\DataObject\ClassificarManualDTO;
use App\DataObject\DistribuirHorariosLoteDTO;
use App\DataObject\FiltrarMediaItemDTO;
use App\DataObject\RebaixarLoteDTO;
use App\DataObject\UploadManualDTO;
use App\Enum\OrigemMedia;
use App\Repository\CategoriaRepository;
use App\Repository\MediaItemRepository;
use App\Serializer\MediaItemSerializer;
use App\Service\GoogleFotos\EnviarGoogleFotosService;
use App\Service\MediaItem\ApagarMediaItemService;
use App\Service\MediaItem\AtualizarMetadataMediaItemService;
use App\Service\MediaItem\ClassificarMediaItemService;
use App\Service\MediaItem\MediaItemService;
use App\Service\MediaItem\ObterArquivoMidiaService;
use App\Service\MediaItem\RebaixarMediaItemService;
use App\Service\MediaItem\RetentarMediaItemService;
use App\Service\MediaItem\UploadManualService;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
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
        private readonly ObterArquivoMidiaService $obterArquivoMidiaService,
        private readonly MediaItemSerializer $mediaItemSerializer,
        private readonly EnviarGoogleFotosService $enviarGoogleFotosService,
        private readonly CategoriaRepository $categoriaRepository,
        private readonly MediaItemRepository $mediaItemRepository,
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

    #[Route('/lote/distribuir-horarios', name: 'distribuir_horarios_lote', methods: ['POST'])]
    public function distribuirHorariosLote(#[MapRequestPayload] DistribuirHorariosLoteDTO $dto): Response
    {
        $itens = $this->atualizarMetadataMediaItemService->distribuirHorarios($dto->itens());

        return $this->success($this->mediaItemSerializer->normalizarLista($itens));
    }

    #[Route('/retentar', name: 'retentar_lote', methods: ['POST'])]
    public function retentarLote(): Response
    {
        $itens = $this->retentarMediaItemService->retentarTodosComErro();

        return $this->success($this->mediaItemSerializer->normalizarLista($itens));
    }

    #[Route('/contagens', name: 'contagens', methods: ['GET'])]
    public function contagens(): Response
    {
        $origens = $this->mediaItemRepository->contarAgrupadoPorOrigem();
        $totalGeral = array_sum($origens);

        $manual = $origens[OrigemMedia::MANUAL->value] ?? 0;
        $downloads = ($origens[OrigemMedia::DOWNLOAD->value] ?? 0) + ($origens[OrigemMedia::BOT_TELEGRAM->value] ?? 0);
        $prints = ($origens[OrigemMedia::PRINT_PESSOAL->value] ?? 0) + ($origens[OrigemMedia::PRINT_EMPRESA->value] ?? 0);

        return $this->success([
            'total' => $totalGeral,
            'manual' => $manual,
            'downloads' => $downloads,
            'prints' => $prints,
            'origens' => $origens,
        ]);
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

    #[Route('/{uuid}/rebaixar', name: 'rebaixar_individual', methods: ['POST'])]
    public function rebaixarIndividual(string $uuid): Response
    {
        $mediaItem = $this->rebaixarMediaItemService->rebaixarIndividual($uuid);

        return $this->success($this->mediaItemSerializer->normalizar($mediaItem));
    }

    #[Route('/{uuid}/forcar-google-fotos', name: 'forcar_google_fotos', methods: ['POST'])]
    public function forcarGoogleFotos(string $uuid, Request $request): Response
    {
        $corpo = json_decode((string) $request->getContent(), true);
        $categoriaId = is_array($corpo) && isset($corpo['categoriaId']) ? (string) $corpo['categoriaId'] : null;

        $mediaItem = $this->mediaItemService->buscarPorUuid($uuid);
        if (null !== $categoriaId && '' !== trim($categoriaId)) {
            $categoria = $this->categoriaRepository->buscarPorUuid($categoriaId);
            if (null !== $categoria) {
                $mediaItem->setCategoriaId($categoriaId);
                $this->mediaItemRepository->salvar($mediaItem);
            }
        }

        if (null === $mediaItem->categoriaId() || '' === trim($mediaItem->categoriaId())) {
            return $this->unprocessable('categoria_obrigatoria', [
                'categoriaId' => 'Selecione uma categoria para vincular ao álbum do Google Fotos.',
            ]);
        }

        try {
            $itemAtualizado = $this->enviarGoogleFotosService->executar($uuid, forcarUpload: true);
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), Response::HTTP_BAD_REQUEST, [
                'motivo' => $e->getMessage(),
            ]);
        }

        return $this->success($this->mediaItemSerializer->normalizar($itemAtualizado));
    }

    #[Route('/{uuid}/stream', name: 'stream', methods: ['GET'])]
    public function streamArquivo(string $uuid): Response
    {
        $arquivoMidia = $this->obterArquivoMidiaService->obterParaStream($uuid);

        $response = new BinaryFileResponse($arquivoMidia->caminhoFisico());
        $response->setAutoEtag();
        $response->headers->set('Accept-Ranges', 'bytes');
        $response->headers->set('Content-Type', $arquivoMidia->mimeType());
        $response->setContentDisposition(
            ResponseHeaderBag::DISPOSITION_INLINE,
            $arquivoMidia->nomeArquivo(),
        );

        return $response;
    }

    #[Route('/{uuid}/thumbnail', name: 'thumbnail', methods: ['GET'])]
    public function thumbnail(string $uuid): Response
    {
        $cacheDir = $this->getParameter('kernel.project_dir') . '/var/cache/thumbnails';
        $cacheArquivo = sprintf('%s/%s.jpg', $cacheDir, $uuid);

        if (file_exists($cacheArquivo) && filesize($cacheArquivo) > 0) {
            $response = new BinaryFileResponse($cacheArquivo);
            $response->setAutoEtag();
            $response->headers->set('Content-Type', 'image/jpeg');
            $response->headers->set('Cache-Control', 'public, max-age=86400');
            $response->setContentDisposition(
                ResponseHeaderBag::DISPOSITION_INLINE,
                $uuid . '.jpg',
            );
            return $response;
        }

        $mediaItem = $this->mediaItemRepository->buscarPorUuid($uuid);
        if (null === $mediaItem) {
            return new Response(null, Response::HTTP_NOT_FOUND);
        }

        try {
            $arquivoMidia = $this->obterArquivoMidiaService->obterParaStream($uuid);
            $caminhoFisico = $arquivoMidia->caminhoFisico();
            $mimeType = $arquivoMidia->mimeType();

            if (str_starts_with($mimeType, 'image/')) {
                $response = new BinaryFileResponse($caminhoFisico);
                $response->setAutoEtag();
                $response->headers->set('Content-Type', $mimeType);
                $response->headers->set('Cache-Control', 'public, max-age=86400');
                $response->setContentDisposition(
                    ResponseHeaderBag::DISPOSITION_INLINE,
                    $arquivoMidia->nomeArquivo(),
                );
                return $response;
            }

            if (str_starts_with($mimeType, 'video/')) {
                if (!is_dir($cacheDir)) {
                    @mkdir($cacheDir, 0777, true);
                }

                $cmd = sprintf('ffmpeg -y -ss 00:00:01 -i %s -vframes 1 -q:v 2 %s 2>/dev/null', escapeshellarg($caminhoFisico), escapeshellarg($cacheArquivo));
                @exec($cmd, $output, $ret);
                if (0 !== $ret || !file_exists($cacheArquivo) || filesize($cacheArquivo) === 0) {
                    $cmd = sprintf('ffmpeg -y -ss 00:00:00 -i %s -vframes 1 -q:v 2 %s 2>/dev/null', escapeshellarg($caminhoFisico), escapeshellarg($cacheArquivo));
                    @exec($cmd);
                }

                if (file_exists($cacheArquivo) && filesize($cacheArquivo) > 0) {
                    $response = new BinaryFileResponse($cacheArquivo);
                    $response->setAutoEtag();
                    $response->headers->set('Content-Type', 'image/jpeg');
                    $response->headers->set('Cache-Control', 'public, max-age=86400');
                    $response->setContentDisposition(
                        ResponseHeaderBag::DISPOSITION_INLINE,
                        $uuid . '.jpg',
                    );
                    return $response;
                }
            }
        } catch (\Throwable) {
            // Se o arquivo físico não estiver disponível, tenta URL remota
        }

        if (null !== $mediaItem->thumbnailUrl() && '' !== $mediaItem->thumbnailUrl()) {
            return new RedirectResponse($mediaItem->thumbnailUrl());
        }

        $metaThumb = $mediaItem->metadata()['thumbnail'] ?? null;
        if (is_string($metaThumb) && '' !== $metaThumb) {
            return new RedirectResponse($metaThumb);
        }

        return new Response(null, Response::HTTP_NOT_FOUND);
    }

    #[Route('/{uuid}/download', name: 'download_arquivo', methods: ['GET'])]
    public function baixarArquivo(string $uuid): Response
    {
        $arquivoMidia = $this->obterArquivoMidiaService->obterParaDownload($uuid);

        $response = new BinaryFileResponse($arquivoMidia->caminhoFisico());
        $response->setContentDisposition(
            ResponseHeaderBag::DISPOSITION_ATTACHMENT,
            $arquivoMidia->nomeArquivo(),
        );

        return $response;
    }
}
