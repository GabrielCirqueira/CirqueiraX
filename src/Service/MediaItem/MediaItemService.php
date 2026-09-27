<?php

declare(strict_types=1);

namespace App\Service\MediaItem;

use App\Entity\MediaItem;
use App\Enum\OrigemMedia;
use App\Enum\StatusMediaItem;
use App\Exception\MediaItem\MediaItemException;
use App\Repository\MediaItemRepository;
use Symfony\Component\Uid\Uuid;

final readonly class MediaItemService
{
    public function __construct(
        private MediaItemRepository $mediaItemRepository,
    ) {}

    public function buscarPorUuid(string|Uuid $uuid): MediaItem
    {
        $mediaItem = $this->mediaItemRepository->buscarPorUuid($uuid);
        if (null === $mediaItem) {
            throw MediaItemException::midiaNaoEncontradaPorUuid();
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
    public function paginarComFiltros(array $filtros = [], int $pagina = 1, int $limite = 20): array
    {
        return $this->mediaItemRepository->paginarComFiltros($filtros, $pagina, $limite);
    }
}
