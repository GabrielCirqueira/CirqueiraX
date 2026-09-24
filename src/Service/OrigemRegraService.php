<?php

declare(strict_types=1);

namespace App\Service;

use App\DataObject\AtualizarOrigemRegraDTO;
use App\DataObject\CriarOrigemRegraDTO;
use App\Entity\OrigemRegra;
use App\Enum\OrigemMedia;
use App\Repository\OrigemRegraRepository;
use Symfony\Component\Uid\Uuid;

final readonly class OrigemRegraService
{
    public function __construct(
        private OrigemRegraRepository $origemRegraRepository,
        private CategoriaService $categoriaService,
    ) {
    }

    public function criar(CriarOrigemRegraDTO $dto): OrigemRegra
    {
        if (null !== $this->origemRegraRepository->buscarPorOrigem($dto->origem())) {
            throw new \DomainException('origem_regra_duplicada', 409);
        }

        $this->categoriaService->buscarPorUuid($dto->categoriaId());

        $regra = OrigemRegra::fromDTO($dto);
        $this->origemRegraRepository->salvar($regra);

        return $regra;
    }

    public function atualizar(string|Uuid $uuid, AtualizarOrigemRegraDTO $dto): OrigemRegra
    {
        $regra = $this->buscarPorUuid($uuid);

        if (null !== $dto->origem() && $dto->origem() !== $regra->origem()) {
            $existente = $this->origemRegraRepository->buscarPorOrigem($dto->origem());
            if (null !== $existente && $existente->uuid()?->toString() !== $regra->uuid()?->toString()) {
                throw new \DomainException('origem_regra_duplicada', 409);
            }
            $regra->setOrigem($dto->origem());
        }

        if (null !== $dto->categoriaId()) {
            $this->categoriaService->buscarPorUuid($dto->categoriaId());
            $regra->setCategoriaId($dto->categoriaId());
        }

        $this->origemRegraRepository->salvar($regra);

        return $regra;
    }

    public function remover(string|Uuid $uuid): void
    {
        $regra = $this->buscarPorUuid($uuid);
        $this->origemRegraRepository->remover($regra);
    }

    public function buscarPorUuid(string|Uuid $uuid): OrigemRegra
    {
        $regra = $this->origemRegraRepository->buscarPorUuid($uuid);

        if (null === $regra) {
            throw new \DomainException('origem_regra_nao_encontrada', 404);
        }

        return $regra;
    }

    public function buscarPorOrigem(OrigemMedia|string $origem): ?OrigemRegra
    {
        return $this->origemRegraRepository->buscarPorOrigem($origem);
    }

    /**
     * @return array{itens: array<int, OrigemRegra>, total: int}
     */
    public function listarPaginado(int $pagina = 1, int $limite = 20): array
    {
        return $this->origemRegraRepository->listarPaginado($pagina, $limite);
    }
}
