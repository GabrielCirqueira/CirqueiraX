<?php

declare(strict_types=1);

namespace App\Serializer;

use App\Entity\MediaItem;
use App\Service\Categoria\CategoriaService;

final class MediaItemSerializer
{
    /** @var array<string, array<string, mixed>> */
    private array $cacheCategorias = [];

    public function __construct(
        private readonly CategoriaService $categoriaService,
        private readonly CategoriaSerializer $categoriaSerializer,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function normalizar(MediaItem $item): array
    {
        $categoriaData = null;
        $catId = $item->categoriaId();
        if (null !== $catId && '' !== trim($catId)) {
            if (array_key_exists($catId, $this->cacheCategorias)) {
                $categoriaData = $this->cacheCategorias[$catId];
            } else {
                try {
                    $categoria = $this->categoriaService->buscarPorUuid($catId);
                    $categoriaData = $this->categoriaSerializer->normalizar($categoria);
                } catch (\Throwable) {
                    $categoriaData = [
                        'uuid' => $catId,
                    ];
                }
                $this->cacheCategorias[$catId] = $categoriaData;
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
            'googlePhotosMediaId' => $item->googleFotosId(),
            'isEnviadoGoogleFotos' => $item->isEnviadoGoogleFotos(),
            'isDuplicado' => $item->isDuplicado(),
            'tamanhoBytes' => $item->tamanhoBytes(),
            'categoriaId' => $item->categoriaId(),
            'categoria' => $categoriaData,
            'thumbnailUrl' => $item->thumbnailUrl(),
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
            fn(MediaItem $item): array => $this->normalizar($item),
            $itens,
        );
    }
}
