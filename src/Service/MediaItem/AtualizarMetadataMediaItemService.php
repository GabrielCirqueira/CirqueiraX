<?php

declare(strict_types=1);

namespace App\Service\MediaItem;

use App\DataObject\AtualizarMetadataMediaItemDTO;
use App\Entity\MediaItem;
use App\Exception\MediaItem\MediaItemException;
use App\Repository\MediaItemRepository;
use App\Support\MetadataKeys;
use Symfony\Component\Uid\Uuid;

final readonly class AtualizarMetadataMediaItemService
{
    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private AplicarMetadataArquivoService $aplicarMetadataArquivoService,
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
        if (isset($metadadosMesclados[MetadataKeys::THUMBNAIL]) && is_string($metadadosMesclados[MetadataKeys::THUMBNAIL])) {
            $mediaItem->setThumbnailUrl($metadadosMesclados[MetadataKeys::THUMBNAIL]);
        }

        $this->mediaItemRepository->salvar($mediaItem);
        $this->aplicarMetadataArquivoService->aplicarEmMediaItem($mediaItem);

        return $mediaItem;
    }

    /**
     * @param list<array{uuid: string, data: string}> $itens
     * @return list<MediaItem>
     */
    public function distribuirHorarios(array $itens): array
    {
        $atualizados = [];
        foreach ($itens as $item) {
            $uuid = $item['uuid'] ?? null;
            $data = $item['data'] ?? null;
            if (!$uuid || !$data) {
                continue;
            }

            $mediaItem = $this->mediaItemRepository->buscarPorUuid((string) $uuid);
            if (null === $mediaItem) {
                continue;
            }

            $metadados = $mediaItem->metadata();
            $metadados[MetadataKeys::DATA] = (string) $data;

            $partes = explode(' ', (string) $data);
            if (isset($partes[1])) {
                $metadados['horario'] = substr($partes[1], 0, 5);
            }

            $mediaItem->setMetadata($metadados);
            $this->mediaItemRepository->salvar($mediaItem);
            $this->aplicarMetadataArquivoService->aplicarEmMediaItem($mediaItem);
            $atualizados[] = $mediaItem;
        }

        return $atualizados;
    }
}
