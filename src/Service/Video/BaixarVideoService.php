<?php

declare(strict_types=1);

namespace App\Service\Video;

use App\DataObject\IngestarMediaDTO;
use App\Entity\MediaItem;
use App\Enum\OrigemMedia;
use App\Exception\Video\YtDlpException;
use App\Service\Ingestao\IngestarMediaService;

final readonly class BaixarVideoService
{
    public function __construct(
        private ValidadorUrlPlataforma $validadorUrl,
        private IngestarMediaService $ingestarMediaService,
        private BaixarVideoDownloadService $baixarVideoDownloadService,
    ) {}

    public function executar(string $url, ?OrigemMedia $origem = null): MediaItem
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

        return $this->ingestarMediaService->executar($dto);
    }
}
