<?php

declare(strict_types=1);

namespace App\Service;

use App\DataObject\ApagarLoteDTO;
use App\DataObject\CategorizarLoteDTO;
use App\DataObject\ClassificarManualDTO;
use App\DataObject\RebaixarLoteDTO;
use App\Entity\MediaItem;
use App\Enum\OrigemMedia;
use App\Enum\StatusMediaItem;
use App\Message\BaixarVideoMessage;
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

    /**
     * @param array{
     *     status?: StatusMediaItem|string|null,
     *     origem?: OrigemMedia|string|null,
     *     categoriaId?: string|null,
     *     busca?: string|null,
     *     ordenacao?: string|null,
     *     direcao?: string|null
     * } $filtros
     *
     * @return array{itens: array<int, MediaItem>, total: int}
     */
    public function paginarComFiltros(array $filtros = [], int $pagina = 1, int $porPagina = 20): array
    {
        return $this->mediaItemRepository->paginarComFiltros($filtros, $pagina, $porPagina);
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

    /**
     * @return list<MediaItem>
     */
    public function classificarEmLote(CategorizarLoteDTO $dto): array
    {
        $dtoIndividual = new ClassificarManualDTO(categoriaId: $dto->categoriaId());
        $itensAtualizados = [];

        foreach ($dto->uuids() as $uuid) {
            $itensAtualizados[] = $this->classificarManualmente($uuid, $dtoIndividual);
        }

        return $itensAtualizados;
    }

    /**
     * @return list<MediaItem>
     */
    public function rebaixarEmLote(RebaixarLoteDTO $dto): array
    {
        $itensProcessados = [];

        foreach ($dto->uuids() as $uuid) {
            $mediaItem = $this->buscarPorUuid($uuid);
            $metadata = $mediaItem->metadata();
            $urlOriginal = $metadata['url_original'] ?? null;

            if (empty($urlOriginal) || !is_string($urlOriginal)) {
                continue;
            }

            $mediaItem->setErroMotivo(null);
            $mediaItem->transicionarPara(StatusMediaItem::BAIXANDO);
            $this->mediaItemRepository->salvar($mediaItem);

            $this->messageBus->dispatch(new BaixarVideoMessage($urlOriginal, $mediaItem->origem()));

            $itensProcessados[] = $mediaItem;
        }

        return $itensProcessados;
    }

    /**
     * @return list<string>
     */
    public function apagarEmLote(ApagarLoteDTO $dto): array
    {
        $removidos = [];

        foreach ($dto->uuids() as $uuid) {
            $mediaItem = $this->mediaItemRepository->buscarPorUuid($uuid);
            if (null === $mediaItem) {
                continue;
            }

            $caminhoLocal = $mediaItem->caminhoLocal();
            if (null !== $caminhoLocal && '' !== $caminhoLocal && file_exists($caminhoLocal) && is_file($caminhoLocal)) {
                @unlink($caminhoLocal);
            }

            $this->mediaItemRepository->remover($mediaItem);
            $removidos[] = $uuid;
        }

        return $removidos;
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
