<?php

declare(strict_types=1);

namespace App\Serializer;

use App\Entity\OrigemRegra;
use App\Service\CategoriaService;

final readonly class OrigemRegraSerializer
{
    public function __construct(
        private CategoriaService $categoriaService,
        private CategoriaSerializer $categoriaSerializer,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function normalizar(OrigemRegra $regra): array
    {
        $categoriaData = null;
        try {
            $categoria = $this->categoriaService->buscarPorUuid($regra->categoriaId());
            $categoriaData = $this->categoriaSerializer->normalizar($categoria);
        } catch (\DomainException) {
            $categoriaData = [
                'uuid' => $regra->categoriaId(),
            ];
        }

        return [
            'uuid' => $regra->uuid()?->toString(),
            'origem' => $regra->origem()->value,
            'categoriaId' => $regra->categoriaId(),
            'categoria' => $categoriaData,
            'criadoEm' => $regra->criadoEm()->format(\DateTimeInterface::ATOM),
            'atualizadoEm' => $regra->atualizadoEm()->format(\DateTimeInterface::ATOM),
        ];
    }

    /**
     * @param array<int, OrigemRegra> $regras
     *
     * @return array<int, array<string, mixed>>
     */
    public function normalizarLista(array $regras): array
    {
        return array_map(
            fn (OrigemRegra $regra): array => $this->normalizar($regra),
            $regras,
        );
    }
}
