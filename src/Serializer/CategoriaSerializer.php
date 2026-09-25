<?php

declare(strict_types=1);

namespace App\Serializer;

use App\Entity\Categoria;

final readonly class CategoriaSerializer
{
    /**
     * @return array<string, mixed>
     */
    public function normalizar(Categoria $categoria): array
    {
        return [
            'uuid' => $categoria->uuid()?->toString(),
            'nome' => $categoria->nome(),
            'pastaLocal' => $categoria->pastaLocal(),
            'googlePhotosAlbumId' => $categoria->googlePhotosAlbumId(),
            'criadoEm' => $categoria->criadoEm()->format(\DateTimeInterface::ATOM),
            'atualizadoEm' => $categoria->atualizadoEm()->format(\DateTimeInterface::ATOM),
        ];
    }

    /**
     * @param array<int, Categoria> $categorias
     *
     * @return array<int, array<string, mixed>>
     */
    public function normalizarLista(array $categorias): array
    {
        return array_map(
            fn(Categoria $categoria): array => $this->normalizar($categoria),
            $categorias,
        );
    }
}
