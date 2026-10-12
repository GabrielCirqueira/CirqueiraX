<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Enum\StatusMediaItem;
use App\Message\RebaixarMediaItemMessage;
use App\Repository\MediaItemRepository;
use App\Service\MediaItem\RebaixarMediaItemService;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class RebaixarMediaItemMessageHandler
{
    public function __construct(
        private RebaixarMediaItemService $rebaixarMediaItemService,
        private MediaItemRepository $mediaItemRepository,
        private ?LoggerInterface $logger = null,
    ) {}

    public function __invoke(RebaixarMediaItemMessage $message): void
    {
        $uuid = $message->mediaItemUuid();
        try {
            $this->logger?->info('Iniciando processamento de rebaixamento de mídia', ['uuid' => $uuid]);
            $this->rebaixarMediaItemService->processarRebaixamento($uuid);
        } catch (\Throwable $e) {
            $this->logger?->error('Falha ao processar rebaixamento de mídia', [
                'uuid' => $uuid,
                'erro' => $e->getMessage(),
            ]);

            $mediaItem = $this->mediaItemRepository->buscarPorUuid($uuid);
            if (null !== $mediaItem) {
                $mediaItem->setErroMotivo('Falha ao rebaixar: ' . $e->getMessage());
                if ($mediaItem->status()->podeTransicionarPara(StatusMediaItem::ERRO)) {
                    $mediaItem->transicionarPara(StatusMediaItem::ERRO);
                }
                $this->mediaItemRepository->salvar($mediaItem);
            }

            throw $e;
        }
    }
}
