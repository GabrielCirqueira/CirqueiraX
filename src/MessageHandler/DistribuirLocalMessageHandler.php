<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Enum\StatusMediaItem;
use App\Message\DistribuirLocalMessage;
use App\Repository\MediaItemRepository;
use App\Service\DistribuirLocalService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class DistribuirLocalMessageHandler
{
    public function __construct(
        private DistribuirLocalService $distribuirLocalService,
        private MediaItemRepository $mediaItemRepository,
    ) {}

    public function __invoke(DistribuirLocalMessage $message): void
    {
        try {
            $this->distribuirLocalService->executar($message->mediaItemUuid());
        } catch (\Throwable $e) {
            $mediaItem = $this->mediaItemRepository->buscarPorUuid($message->mediaItemUuid());
            if (null !== $mediaItem && !$mediaItem->status()->isFinal()) {
                $mediaItem->setErroMotivo($e->getMessage());
                $mediaItem->transicionarPara(StatusMediaItem::ERRO);
                $this->mediaItemRepository->salvar($mediaItem);
            }
            throw $e;
        }
    }
}
