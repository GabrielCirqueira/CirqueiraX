<?php

declare(strict_types=1);

namespace App\Controller\Video;

use App\Controller\Common\DefaultController;
use App\DataObject\BaixarVideoDTO;
use App\Enum\OrigemMedia;
use App\Serializer\MediaItemSerializer;
use App\Service\Video\BaixarVideoService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/downloads', name: 'api_downloads_')]
final class DownloadController extends DefaultController
{
    public function __construct(
        private readonly BaixarVideoService $baixarVideoService,
        private readonly MediaItemSerializer $mediaItemSerializer,
    ) {}

    #[Route('', name: 'solicitar', methods: ['POST'])]
    public function solicitar(#[MapRequestPayload] BaixarVideoDTO $dto): Response
    {
        $mediaItem = $this->baixarVideoService->executar($dto->url(), OrigemMedia::DOWNLOAD, $dto->categoriaId());

        return $this->created($this->mediaItemSerializer->normalizar($mediaItem));
    }
}
