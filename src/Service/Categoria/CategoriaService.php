<?php

declare(strict_types=1);

namespace App\Service\Categoria;

use App\DataObject\CriarCategoriaDTO;
use App\Entity\Categoria;
use App\Exception\Categoria\CategoriaException;
use App\Repository\CategoriaRepository;
use Symfony\Component\Uid\Uuid;

final readonly class CategoriaService
{
    public function __construct(
        private CategoriaRepository $categoriaRepository,
    ) {}

    public function criar(CriarCategoriaDTO $dto): Categoria
    {
        if ($this->categoriaRepository->existeComNome($dto->nome())) {
            throw CategoriaException::nomeJaExiste($dto->nome());
        }

        $categoria = Categoria::fromDTO($dto);
        $this->categoriaRepository->salvar($categoria);

        return $categoria;
    }

    public function atualizar(string|Uuid $uuid, CriarCategoriaDTO $dto): Categoria
    {
        $categoria = $this->buscarPorUuid($uuid);

        if ($categoria->nome() !== $dto->nome() && $this->categoriaRepository->existeComNome($dto->nome(), $uuid)) {
            throw CategoriaException::nomeJaExiste($dto->nome());
        }

        $categoria->setNome($dto->nome());
        $categoria->setPastaLocal($dto->pastaLocal());

        $this->categoriaRepository->salvar($categoria);

        return $categoria;
    }

    /**
     * @return list<Categoria>
     */
    public function listarTodas(): array
    {
        return $this->categoriaRepository->listarTodas();
    }

    public function buscarPorUuid(string|Uuid $uuid): Categoria
    {
        $categoria = $this->categoriaRepository->buscarPorUuid($uuid);
        if (null === $categoria) {
            throw CategoriaException::categoriaNaoEncontrada();
        }

        return $categoria;
    }

    public function remover(string|Uuid $uuid): void
    {
        $categoria = $this->buscarPorUuid($uuid);
        $this->categoriaRepository->remover($categoria);
    }
}
