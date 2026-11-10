<?php

declare(strict_types=1);

namespace App\Service\OrigemRegra;

use App\DataObject\CriarOrigemRegraDTO;
use App\Entity\OrigemRegra;
use App\Entity\Usuario;
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

    public function criar(CriarOrigemRegraDTO $dto, Usuario $usuario): OrigemRegra
    {
        if ($this->origemRegraRepository->existeComOrigem($usuario, $dto->origem())) {
            throw OrigemRegraException::regraDuplicada($dto->origem()->value);
        }

        $this->categoriaService->buscarDoUsuario($dto->categoriaId(), $usuario);

        $origemRegra = OrigemRegra::fromDTO($dto, $usuario);
        $this->origemRegraRepository->salvar($origemRegra);

        return $origemRegra;
    }

    public function atualizar(string|Uuid $uuid, CriarOrigemRegraDTO $dto, Usuario $usuario): OrigemRegra
    {
        $origemRegra = $this->buscarDoUsuario($uuid, $usuario);

        if ($origemRegra->origem()->value !== $dto->origem()->value && $this->origemRegraRepository->existeComOrigem($usuario, $dto->origem(), $uuid)) {
            throw OrigemRegraException::regraDuplicada($dto->origem()->value);
        }

        $categoria = $this->categoriaService->buscarDoUsuario($dto->categoriaId(), $usuario);

        $origemRegra->setOrigem($dto->origem());
        $origemRegra->setCategoriaId($categoria->uuid()?->toString() ?? $dto->categoriaId());

        $this->origemRegraRepository->salvar($origemRegra);

        return $origemRegra;
    }

    /**
     * @return list<OrigemRegra>
     */
    public function listarTodas(Usuario $usuario): array
    {
        return $this->origemRegraRepository->listarTodas($usuario);
    }

    public function buscarDoUsuario(string|Uuid $uuid, Usuario $usuario): OrigemRegra
    {
        $origemRegra = $this->origemRegraRepository->buscarDoUsuario($uuid, $usuario);
        if (null === $origemRegra) {
            throw OrigemRegraException::regraNaoEncontrada();
        }

        return $origemRegra;
    }

    public function remover(string|Uuid $uuid, Usuario $usuario): void
    {
        $origemRegra = $this->buscarDoUsuario($uuid, $usuario);
        $this->origemRegraRepository->remover($origemRegra);
    }
}
