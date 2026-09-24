<?php

declare(strict_types=1);

namespace App\Service;

use App\DataObject\AtualizarCategoriaDTO;
use App\DataObject\CriarCategoriaDTO;
use App\Entity\Categoria;
use App\Repository\CategoriaRepository;
use Symfony\Component\Uid\Uuid;

final readonly class CategoriaService
{
    public function __construct(
        private CategoriaRepository $categoriaRepository,
    ) {
    }

    public function criar(CriarCategoriaDTO $dto): Categoria
    {
        if (null !== $this->categoriaRepository->buscarPorNome($dto->nome())) {
            throw new \DomainException('categoria_nome_duplicado', 409);
        }

        $categoria = Categoria::fromDTO($dto);
        $this->categoriaRepository->salvar($categoria);

        return $categoria;
    }

    public function atualizar(string|Uuid $uuid, AtualizarCategoriaDTO $dto): Categoria
    {
        $categoria = $this->buscarPorUuid($uuid);

        if (null !== $dto->nome() && $dto->nome() !== $categoria->nome()) {
            $existente = $this->categoriaRepository->buscarPorNome($dto->nome());
            if (null !== $existente && $existente->uuid()?->toString() !== $categoria->uuid()?->toString()) {
                throw new \DomainException('categoria_nome_duplicado', 409);
            }
            $categoria->setNome($dto->nome());
        }

        if (null !== $dto->pastaLocal()) {
            $categoria->setPastaLocal($dto->pastaLocal());
        }

        if (null !== $dto->googlePhotosAlbumId()) {
            $categoria->setGooglePhotosAlbumId($dto->googlePhotosAlbumId());
        }

        $this->categoriaRepository->salvar($categoria);

        return $categoria;
    }

    public function remover(string|Uuid $uuid): void
    {
        $categoria = $this->buscarPorUuid($uuid);
        $this->categoriaRepository->remover($categoria);
    }

    public function buscarPorUuid(string|Uuid $uuid): Categoria
    {
        $categoria = $this->categoriaRepository->buscarPorUuid($uuid);

        if (null === $categoria) {
            throw new \DomainException('categoria_nao_encontrada', 404);
        }

        return $categoria;
    }

    /**
     * @return array{itens: array<int, Categoria>, total: int}
     */
    public function listarPaginado(int $pagina = 1, int $limite = 20): array
    {
        return $this->categoriaRepository->listarPaginado($pagina, $limite);
    }
}
