<?php

declare(strict_types=1);

namespace App\Serializer;

use App\Entity\MediaItem;
use App\Service\CategoriaService;

final readonly class MediaItemSerializer
{
    public function __construct(
        private CategoriaService $categoriaService,
        private CategoriaSerializer $categoriaSerializer,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function normalizar(MediaItem $item): array
    {
        $categoriaData = null;
        if (null !== $item->categoriaId()) {
            try {
                $categoria = $this->categoriaService->buscarPorUuid($item->categoriaId());
                $categoriaData = $this->categoriaSerializer->normalizar($categoria);
            } catch (\DomainException) {
                $categoriaData = [
                    'uuid' => $item->categoriaId(),
                ];
            }
        }

        return [
            'uuid' => $item->uuid()?->toString(),
            'hash' => $item->hash(),
            'origem' => $item->origem()->value,
            'origemDescricao' => $item->origem()->descricao(),
            'status' => $item->status()->value,
            'statusDescricao' => $item->status()->descricao(),
            'caminhoLocal' => $item->caminhoLocal(),
            'googlePhotosMediaId' => $item->googlePhotosMediaId(),
            'categoriaId' => $item->categoriaId(),
            'categoria' => $categoriaData,
            'metadata' => $item->metadata(),
            'erroMotivo' => $item->erroMotivo(),
            'historicoStatus' => $item->historicoStatus(),
            'criadoEm' => $item->criadoEm()->format(\DateTimeInterface::ATOM),
            'atualizadoEm' => $item->atualizadoEm()->format(\DateTimeInterface::ATOM),
        ];
    }

    /**
     * @param array<int, MediaItem> $itens
     *
     * @return array<int, array<string, mixed>>
     */
    public function normalizarLista(array $itens): array
    {
        return array_map(
            fn (MediaItem $item): array => $this->normalizar($item),
            $itens,
        );
    }
}
