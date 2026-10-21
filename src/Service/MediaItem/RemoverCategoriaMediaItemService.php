<?php

declare(strict_types=1);

namespace App\Service\MediaItem;

use App\DataObject\RemoverCategoriaLoteDTO;
use App\Entity\MediaItem;
use App\Exception\MediaItem\MediaItemException;
use App\Repository\MediaItemRepository;
use Psr\Log\LoggerInterface;

final readonly class RemoverCategoriaMediaItemService
{
    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private LoggerInterface $logger,
    ) {}

    /**
     * @return list<MediaItem>
     */
    public function removerEmLote(RemoverCategoriaLoteDTO $dto): array
    {
        $removidos = [];
        foreach ($dto->uuids() as $uuid) {
            $mediaItem = $this->removerItemIndividual($uuid);
            if (null !== $mediaItem) {
                $removidos[] = $mediaItem;
            }
        }

        $this->mediaItemRepository->flush();

        return $removidos;
    }

    private function removerItemIndividual(string $uuid): ?MediaItem
    {
        try {
            $mediaItem = $this->mediaItemRepository->buscarPorUuid($uuid);
            if (null === $mediaItem) {
                throw MediaItemException::midiaNaoEncontradaPorUuid();
            }

            $mediaItem->removerCategoria();
            $this->mediaItemRepository->salvar($mediaItem, flush: false);

            return $mediaItem;
        } catch (MediaItemException $erro) {
            $this->logger->warning('Não foi possível remover a categoria da mídia.', [
                'uuid' => $uuid,
                'motivo' => $erro->getMessage(),
            ]);

            return null;
        }
    }
}
