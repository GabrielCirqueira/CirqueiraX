<?php

declare(strict_types=1);

namespace App\Service\Categoria;

use App\DataObject\CriarCategoriaDTO;
use App\Entity\Categoria;
use App\Entity\Usuario;
use App\Exception\Categoria\CategoriaException;
use App\Repository\CategoriaRepository;
use Symfony\Component\Uid\Uuid;

final readonly class CategoriaService
{
    public function __construct(
        private CategoriaRepository $categoriaRepository,
    ) {}

    public function criar(CriarCategoriaDTO $dto, Usuario $usuario): Categoria
    {
        if ($this->categoriaRepository->existeComNome($usuario, $dto->nome())) {
            throw CategoriaException::nomeJaExiste($dto->nome());
        }

        $categoria = Categoria::fromDTO($dto, $usuario);
        $this->categoriaRepository->salvar($categoria);

        return $categoria;
    }

    public function atualizar(string|Uuid $uuid, CriarCategoriaDTO $dto, Usuario $usuario): Categoria
    {
        $categoria = $this->buscarDoUsuario($uuid, $usuario);

        if ($categoria->nome() !== $dto->nome() && $this->categoriaRepository->existeComNome($usuario, $dto->nome(), $uuid)) {
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
    public function listarTodas(Usuario $usuario): array
    {
        return $this->categoriaRepository->listarTodas($usuario);
    }

    public function buscarDoUsuario(string|Uuid $uuid, Usuario $usuario): Categoria
    {
        $categoria = $this->categoriaRepository->buscarDoUsuario($uuid, $usuario);
        if (null === $categoria) {
            throw CategoriaException::categoriaNaoEncontrada();
        }

        return $categoria;
    }

    public function buscarPorUuid(string|Uuid $uuid): Categoria
    {
        $categoria = $this->categoriaRepository->buscarPorUuid($uuid);
        if (null === $categoria) {
            throw CategoriaException::categoriaNaoEncontrada();
        }

        return $categoria;
    }

    public function remover(string|Uuid $uuid, Usuario $usuario): void
    {
        $categoria = $this->buscarDoUsuario($uuid, $usuario);
        $this->categoriaRepository->remover($categoria);
    }
}
