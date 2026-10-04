<?php

declare(strict_types=1);

namespace App\Service\MediaItem;

use App\DataObject\RebaixarLoteDTO;
use App\Entity\MediaItem;
use App\Enum\StatusMediaItem;
use App\Message\BaixarVideoMessage;
use App\Repository\MediaItemRepository;
use App\Support\TextoUtil;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class RebaixarMediaItemService
{
    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private MessageBusInterface $messageBus,
    ) {}

    /**
     * @return list<MediaItem>
     */
    public function rebaixarEmLote(RebaixarLoteDTO $dto): array
    {
        $resultado = [];
        foreach ($dto->uuids() as $uuid) {
            $mediaItem = $this->mediaItemRepository->buscarPorUuid($uuid);
            if (null === $mediaItem) {
                continue;
            }

            $mediaItem->setErroMotivo(null);
            $mediaItem->transicionarPara(StatusMediaItem::BAIXANDO);
            $this->mediaItemRepository->salvar($mediaItem);

            $metadata = $mediaItem->metadata();
            /** @var string|null $urlOriginal */
            $urlOriginal = $metadata['url_original'] ?? null;

            if (TextoUtil::naoEstaEmBranco($urlOriginal)) {
                $this->messageBus->dispatch(new BaixarVideoMessage(
                    $urlOriginal,
                    $mediaItem->origem()
                ));
            }

            $resultado[] = $mediaItem;
        }

        return $resultado;
    }
}
