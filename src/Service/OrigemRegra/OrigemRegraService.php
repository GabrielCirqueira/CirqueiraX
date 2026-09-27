<?php

declare(strict_types=1);

namespace App\Service\OrigemRegra;

use App\DataObject\CriarOrigemRegraDTO;
use App\Entity\OrigemRegra;
use App\Exception\OrigemRegra\OrigemRegraException;
use App\Repository\OrigemRegraRepository;
use App\Service\Categoria\CategoriaService;
use Symfony\Component\Uid\Uuid;

final readonly class OrigemRegraService
{
    public function __construct(
        private OrigemRegraRepository $origemRegraRepository,
        private CategoriaService $categoriaService,
    ) {}

    public function criar(CriarOrigemRegraDTO $dto): OrigemRegra
    {
        if ($this->origemRegraRepository->existeComOrigem($dto->origem())) {
            throw OrigemRegraException::regraDuplicada($dto->origem()->value);
        }

        $categoria = $this->categoriaService->buscarPorUuid($dto->categoriaId());

        $origemRegra = OrigemRegra::fromDTO($dto);
        $this->origemRegraRepository->salvar($origemRegra);

        return $origemRegra;
    }

    public function atualizar(string|Uuid $uuid, CriarOrigemRegraDTO $dto): OrigemRegra
    {
        $origemRegra = $this->buscarPorUuid($uuid);

        if ($origemRegra->origem()->value !== $dto->origem()->value && $this->origemRegraRepository->existeComOrigem($dto->origem(), $uuid)) {
            throw OrigemRegraException::regraDuplicada($dto->origem()->value);
        }

        $categoria = $this->categoriaService->buscarPorUuid($dto->categoriaId());

        $origemRegra->setOrigem($dto->origem());
        $origemRegra->setCategoriaId($categoria->uuid()?->toString() ?? $dto->categoriaId());

        $this->origemRegraRepository->salvar($origemRegra);

        return $origemRegra;
    }

    /**
     * @return list<OrigemRegra>
     */
    public function listarTodas(): array
    {
        return $this->origemRegraRepository->listarTodas();
    }

    public function buscarPorUuid(string|Uuid $uuid): OrigemRegra
    {
        $origemRegra = $this->origemRegraRepository->buscarPorUuid($uuid);
        if (null === $origemRegra) {
            throw OrigemRegraException::regraNaoEncontrada();
        }

        return $origemRegra;
    }

    public function remover(string|Uuid $uuid): void
    {
        $origemRegra = $this->buscarPorUuid($uuid);
        $this->origemRegraRepository->remover($origemRegra);
    }
}
