<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Enum\StatusMediaItem;
use App\Message\EnviarGoogleFotosMessage;
use App\Repository\MediaItemRepository;
use App\Service\EnviarGoogleFotosService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class EnviarGoogleFotosMessageHandler
{
    public function __construct(
        private EnviarGoogleFotosService $enviarGoogleFotosService,
        private MediaItemRepository $mediaItemRepository,
    ) {}

    public function __invoke(EnviarGoogleFotosMessage $message): void
    {
        try {
            $this->enviarGoogleFotosService->executar($message->mediaItemUuid());
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
