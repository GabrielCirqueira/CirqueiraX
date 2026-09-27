<?php

declare(strict_types=1);

namespace App\Service\MediaItem;

use App\Entity\MediaItem;
use App\Enum\StatusMediaItem;
use App\Exception\MediaItem\MediaItemException;
use App\Message\ClassificarMediaMessage;
use App\Repository\MediaItemRepository;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Uid\Uuid;

final readonly class RetentarMediaItemService
{
    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private ClassificarMediaItemService $classificarMediaItemService,
        private MessageBusInterface $messageBus,
    ) {}

    public function retentar(string|Uuid $uuid): MediaItem
    {
        $mediaItem = $this->mediaItemRepository->buscarPorUuid($uuid);
        if (null === $mediaItem) {
            throw MediaItemException::midiaNaoEncontradaPorUuid();
        }

        $this->retentarMediaItem($mediaItem);

        return $mediaItem;
    }

    /**
     * @return list<MediaItem>
     */
    public function retentarTodosComErro(): array
    {
        $itensComErro = $this->mediaItemRepository->buscarPorStatus(StatusMediaItem::ERRO);
        foreach ($itensComErro as $mediaItem) {
            $this->retentarMediaItem($mediaItem);
        }

        return $itensComErro;
    }

    private function retentarMediaItem(MediaItem $mediaItem): void
    {
        $mediaItem->setErroMotivo(null);

        if (null !== $mediaItem->categoriaId()) {
            $mediaItem->transicionarPara(StatusMediaItem::CLASSIFICADO);
            $this->mediaItemRepository->salvar($mediaItem);

            $this->classificarMediaItemService->despacharProcessamentoPósClassificacao($mediaItem);

            return;
        }

        $mediaItem->transicionarPara(StatusMediaItem::RECEBIDO);
        $this->mediaItemRepository->salvar($mediaItem);

        if (null !== $mediaItem->uuid()) {
            $this->messageBus->dispatch(new ClassificarMediaMessage($mediaItem->uuid()->toString()));
        }
    }
}
