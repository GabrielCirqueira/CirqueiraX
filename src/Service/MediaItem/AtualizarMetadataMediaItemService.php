<?php

declare(strict_types=1);

namespace App\Service\MediaItem;

use App\DataObject\AtualizarMetadataMediaItemDTO;
use App\Entity\MediaItem;
use App\Exception\MediaItem\MediaItemException;
use App\Repository\MediaItemRepository;
use Symfony\Component\Uid\Uuid;

final readonly class AtualizarMetadataMediaItemService
{
    public function __construct(
        private MediaItemRepository $mediaItemRepository,
    ) {}

    public function atualizarMetadata(string|Uuid $uuid, AtualizarMetadataMediaItemDTO $dto): MediaItem
    {
        $mediaItem = $this->mediaItemRepository->buscarPorUuid($uuid);
        if (null === $mediaItem) {
            throw MediaItemException::midiaNaoEncontradaPorUuid();
        }

        $novosMetadados = $dto->paraArray();
        if (empty($novosMetadados)) {
            return $mediaItem;
        }

        $metadadosAtuais = $mediaItem->metadata();
        $metadadosMesclados = array_merge($metadadosAtuais, $novosMetadados);

        $mediaItem->setMetadata($metadadosMesclados);
        $this->mediaItemRepository->salvar($mediaItem);

        return $mediaItem;
    }
}
