<?php

declare(strict_types=1);

namespace App\Service\Video;

use App\DataObject\ClassificarManualDTO;
use App\DataObject\IngestarMediaDTO;
use App\Entity\MediaItem;
use App\Enum\OrigemMedia;
use App\Exception\Video\YtDlpException;
use App\Service\Ingestao\IngestarMediaService;
use App\Service\MediaItem\ClassificarMediaItemService;
use App\Support\TextoUtil;

final readonly class BaixarVideoService
{
    public function __construct(
        private ValidadorUrlPlataforma $validadorUrl,
        private IngestarMediaService $ingestarMediaService,
        private BaixarVideoDownloadService $baixarVideoDownloadService,
        private ClassificarMediaItemService $classificarMediaItemService,
    ) {}

    public function executar(string $url, ?OrigemMedia $origem = null, ?string $categoriaId = null): MediaItem
    {
        if (!$this->validadorUrl->ehUrlSuportada($url)) {
            throw YtDlpException::urlInvalidaOuNaoSuportada($url);
        }

        $metadataExtraida = $this->baixarVideoDownloadService->extrairMetadata($url);
        $caminhoLocal = $this->baixarVideoDownloadService->baixarParaStorage($url);

        $dto = new IngestarMediaDTO(
            caminhoArquivo: $caminhoLocal,
            origem: $origem ?? OrigemMedia::DOWNLOAD,
            metadata: $metadataExtraida,
        );

        $mediaItem = $this->ingestarMediaService->executar($dto);

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
