<?php

declare(strict_types=1);

namespace App\Service\Video;

use App\DataObject\ClassificarManualDTO;
use App\DataObject\IngestarMediaDTO;
use App\Entity\MediaItem;
use App\Enum\OrigemMedia;
use App\Exception\Video\YtDlpException;
use App\Interface\ArmazenamentoInterface;
use App\Repository\MediaItemRepository;
use App\Service\Ingestao\IngestarMediaService;
use App\Service\MediaItem\AplicarMetadataArquivoService;
use App\Service\MediaItem\ClassificarMediaItemService;
use App\Support\MetadataKeys;
use App\Support\TextoUtil;

final readonly class BaixarVideoService
{
    public function __construct(
        private ValidadorUrlPlataforma $validadorUrl,
        private IngestarMediaService $ingestarMediaService,
        private BaixarVideoDownloadService $baixarVideoDownloadService,
        private ClassificarMediaItemService $classificarMediaItemService,
        private MediaItemRepository $mediaItemRepository,
        private ArmazenamentoInterface $armazenamentoClient,
        private AplicarMetadataArquivoService $aplicarMetadataArquivoService,
    ) {}

    public function executar(string $url, ?OrigemMedia $origem = null, ?string $categoriaId = null): MediaItem
    {
        if (!$this->validadorUrl->ehUrlSuportada($url)) {
            throw YtDlpException::urlInvalidaOuNaoSuportada($url);
        }

        $itemExistente = $this->mediaItemRepository->buscarPorUrlOriginal($url);
        if (null !== $itemExistente) {
            $tentativas = ((int) ($itemExistente->metadata()[MetadataKeys::TENTATIVAS_DUPLICADAS] ?? 0)) + 1;
            $itemExistente->adicionarMetadata(MetadataKeys::TENTATIVAS_DUPLICADAS, $tentativas);
            $itemExistente->adicionarMetadata(MetadataKeys::DATA_DETECCAO_DUPLICADO, (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM));

            if (null !== $categoriaId && TextoUtil::naoEstaEmBranco($categoriaId) && $itemExistente->categoriaId() !== $categoriaId) {
                $uuid = $itemExistente->uuid()?->toString();
                if (null !== $uuid && '' !== $uuid) {
                    $itemExistente = $this->classificarMediaItemService->classificarManualmente(
                        $uuid,
                        new ClassificarManualDTO($categoriaId)
                    );
                }
            }

            $this->mediaItemRepository->salvar($itemExistente);

            return $itemExistente;
        }

        $metadataExtraida = $this->baixarVideoDownloadService->extrairMetadata($url);
        $caminhoLocal = $this->baixarVideoDownloadService->baixarParaStorage($url);

        $dto = new IngestarMediaDTO(
            caminhoArquivo: $caminhoLocal,
            origem: $origem ?? OrigemMedia::DOWNLOAD,
            metadata: $metadataExtraida,
        );

        $mediaItem = $this->ingestarMediaService->executar($dto);
        $this->aplicarMetadataArquivoService->aplicarEmMediaItem($mediaItem);

        if (null !== $mediaItem->caminhoLocal() && $mediaItem->caminhoLocal() !== $caminhoLocal && file_exists($caminhoLocal)) {
            $this->armazenamentoClient->remover($caminhoLocal);
        }

        if (null !== $categoriaId && TextoUtil::naoEstaEmBranco($categoriaId)) {
            $uuid = $mediaItem->uuid()?->toString();
            if (null !== $uuid && '' !== $uuid) {
                $mediaItem = $this->classificarMediaItemService->classificarManualmente(
                    $uuid,
                    new ClassificarManualDTO($categoriaId)
                );
            }
        }

        return $mediaItem;
    }
}
