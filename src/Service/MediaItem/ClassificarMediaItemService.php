<?php

declare(strict_types=1);

namespace App\Service\MediaItem;

use App\DataObject\CategorizarLoteDTO;
use App\DataObject\ClassificarManualDTO;
use App\Entity\MediaItem;
use App\Enum\StatusMediaItem;
use App\Exception\MediaItem\MediaItemException;
use App\Message\DistribuirLocalMessage;
use App\Message\EnviarGoogleFotosMessage;
use App\Repository\MediaItemRepository;
use App\Service\Categoria\CategoriaService;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Uid\Uuid;

final readonly class ClassificarMediaItemService
{
    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private CategoriaService $categoriaService,
        private MessageBusInterface $messageBus,
    ) {}

    public function classificarManualmente(string|Uuid $uuid, ClassificarManualDTO $dto): MediaItem
    {
        $mediaItem = $this->mediaItemRepository->buscarPorUuid($uuid);
        if (null === $mediaItem) {
            throw MediaItemException::midiaNaoEncontradaPorUuid();
        }

        $categoria = $this->categoriaService->buscarPorUuid($dto->categoriaId());

        $mediaItem->classificarComo($categoria);
        $this->mediaItemRepository->salvar($mediaItem);

        $this->despacharProcessamentoPósClassificacao($mediaItem);

        return $mediaItem;
    }

    /**
     * @return list<MediaItem>
     */
    public function classificarEmLote(CategorizarLoteDTO $dto): array
    {
        $resultado = [];
        foreach ($dto->uuids() as $uuid) {
            try {
                $resultado[] = $this->classificarManualmente($uuid, new ClassificarManualDTO($dto->categoriaId()));
            } catch (\Throwable) {
                // Silently skip item failure in batch to remain resilient
                continue;
            }
        }

        return $resultado;
    }

    public function despacharProcessamentoPósClassificacao(MediaItem $mediaItem): void
    {
        if (null !== $mediaItem->uuid()) {
            $mediaUuidStr = $mediaItem->uuid()->toString();
            $this->messageBus->dispatch(new DistribuirLocalMessage($mediaUuidStr));
            $this->messageBus->dispatch(new EnviarGoogleFotosMessage($mediaUuidStr));
        }
    }
}
