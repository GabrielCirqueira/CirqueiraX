<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Enum\StatusMediaItem;
use App\Message\ClassificarMediaMessage;
use App\Message\DistribuirLocalMessage;
use App\Message\EnviarGoogleFotosMessage;
use App\Repository\MediaItemRepository;
use App\Repository\OrigemRegraRepository;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Messenger\MessageBusInterface;

#[AsMessageHandler]
final readonly class ClassificarMediaMessageHandler
{
    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private OrigemRegraRepository $origemRegraRepository,
        private MessageBusInterface $messageBus,
    ) {
    }

    public function __invoke(ClassificarMediaMessage $message): void
    {
        $mediaItem = $this->mediaItemRepository->buscarPorUuid($message->mediaItemUuid());
        if (null === $mediaItem || $mediaItem->status()->isFinal()) {
            return;
        }

        $regra = $this->origemRegraRepository->buscarPorOrigem($mediaItem->origem());
        if (null !== $regra) {
            $mediaItem->setCategoriaId($regra->categoriaId());
            $mediaItem->transicionarPara(StatusMediaItem::CLASSIFICADO);
            $this->mediaItemRepository->salvar($mediaItem);

            $mediaUuidStr = $message->mediaItemUuid();
            $this->messageBus->dispatch(new DistribuirLocalMessage($mediaUuidStr));
            $this->messageBus->dispatch(new EnviarGoogleFotosMessage($mediaUuidStr));

            return;
        }

        $mediaItem->transicionarPara(StatusMediaItem::EM_FILA);
        $this->mediaItemRepository->salvar($mediaItem);
    }
}
