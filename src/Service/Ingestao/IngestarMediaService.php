<?php

declare(strict_types=1);

namespace App\Service\Ingestao;

use App\DataObject\IngestarMediaDTO;
use App\Entity\MediaItem;
use App\Interface\ArmazenamentoInterface;
use App\Message\ClassificarMediaMessage;
use App\Repository\MediaItemRepository;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class IngestarMediaService
{
    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private ArmazenamentoInterface $armazenamentoClient,
        private MessageBusInterface $messageBus,
    ) {}

    public function executar(IngestarMediaDTO $dto): MediaItem
    {
        $hash = $dto->hash() ?? $this->armazenamentoClient->calcularHash($dto->caminhoArquivo());

        $mediaItem = $this->mediaItemRepository->buscarPorHash($hash);
        if (null !== $mediaItem) {
            return $mediaItem;
        }

        $mediaItem = MediaItem::fromIngestaoDTO($dto, $hash);
        $this->mediaItemRepository->salvar($mediaItem);

        if (null !== $mediaItem->uuid()) {
            $this->messageBus->dispatch(new ClassificarMediaMessage($mediaItem->uuid()->toString()));
        }

        return $mediaItem;
    }
}
