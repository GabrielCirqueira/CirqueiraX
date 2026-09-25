<?php

declare(strict_types=1);

namespace App\Service;

use App\DataObject\ClassificarManualDTO;
use App\Entity\MediaItem;
use App\Enum\StatusMediaItem;
use App\Message\ClassificarMediaMessage;
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
    ) {}

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

    public function retentar(string|Uuid $uuid): MediaItem
    {
        $mediaItem = $this->buscarPorUuid($uuid);
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

            if (null !== $mediaItem->uuid()) {
                $mediaUuidStr = $mediaItem->uuid()->toString();
                $this->messageBus->dispatch(new DistribuirLocalMessage($mediaUuidStr));
                $this->messageBus->dispatch(new EnviarGoogleFotosMessage($mediaUuidStr));
            }

            return;
        }

        $mediaItem->transicionarPara(StatusMediaItem::RECEBIDO);
        $this->mediaItemRepository->salvar($mediaItem);

        if (null !== $mediaItem->uuid()) {
            $this->messageBus->dispatch(new ClassificarMediaMessage($mediaItem->uuid()->toString()));
        }
    }
}
