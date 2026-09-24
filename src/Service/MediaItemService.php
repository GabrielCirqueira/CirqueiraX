<?php

declare(strict_types=1);

namespace App\Service;

use App\DataObject\ClassificarManualDTO;
use App\Entity\MediaItem;
use App\Enum\StatusMediaItem;
use App\Message\DistribuirLocalMessage;
use App\Message\EnviarGoogleFotosMessage;
use App\Repository\MediaItemRepository;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Uid\Uuid;

final readonly class MediaItemService
{
    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private CategoriaService $categoriaService,
        private MessageBusInterface $messageBus,
    ) {
    }

    public function buscarPorUuid(string|Uuid $uuid): MediaItem
    {
        $mediaItem = $this->mediaItemRepository->buscarPorUuid($uuid);
        if (null === $mediaItem) {
            throw new \DomainException('media_item_nao_encontrado', 404);
        }

        return $mediaItem;
    }

    /**
     * @return array{itens: array<int, MediaItem>, total: int}
     */
    public function listarPaginado(int $pagina = 1, int $limite = 20): array
    {
        return $this->mediaItemRepository->listarPaginado($pagina, $limite);
    }

    public function classificarManualmente(string|Uuid $uuid, ClassificarManualDTO $dto): MediaItem
    {
        $mediaItem = $this->buscarPorUuid($uuid);
        $this->categoriaService->buscarPorUuid($dto->categoriaId());

        $mediaItem->setCategoriaId($dto->categoriaId());
        $mediaItem->transicionarPara(StatusMediaItem::CLASSIFICADO);
        $this->mediaItemRepository->salvar($mediaItem);

        if (null !== $mediaItem->uuid()) {
            $mediaItemUuidStr = $mediaItem->uuid()->toString();
            $this->messageBus->dispatch(new DistribuirLocalMessage($mediaItemUuidStr));
            $this->messageBus->dispatch(new EnviarGoogleFotosMessage($mediaItemUuidStr));
        }

        return $mediaItem;
    }
}
