<?php

declare(strict_types=1);

namespace App\Service;

use App\DataObject\IngestarMediaDTO;
use App\Entity\MediaItem;
use App\Enum\StatusMediaItem;
use App\Message\ClassificarMediaMessage;
use App\Repository\MediaItemRepository;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class IngestarMediaService
{
    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private MessageBusInterface $messageBus,
    ) {}

    public function executar(IngestarMediaDTO $dto): MediaItem
    {
        $hash = $dto->calcularHash();

        $existente = $this->mediaItemRepository->buscarPorHash($hash);
        if (null !== $existente) {
            return $existente;
        }

        $mediaItem = new MediaItem(
            hash: $hash,
            origem: $dto->origem(),
            status: StatusMediaItem::RECEBIDO,
        );
        $mediaItem->setCaminhoLocal($dto->caminhoArquivo());

        if (!empty($dto->metadata())) {
            $mediaItem->setMetadata($dto->metadata());
        }

        $this->mediaItemRepository->salvar($mediaItem);

        if (null !== $mediaItem->uuid()) {
            $this->messageBus->dispatch(new ClassificarMediaMessage($mediaItem->uuid()->toString()));
        }

        return $mediaItem;
    }
}
