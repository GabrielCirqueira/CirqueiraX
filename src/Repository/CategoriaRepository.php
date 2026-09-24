<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Categoria;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<Categoria>
 */
class CategoriaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Categoria::class);
    }

    public function salvar(Categoria $categoria, bool $flush = true): void
    {
        $this->getEntityManager()->persist($categoria);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(Categoria $categoria, bool $flush = true): void
    {
        $this->getEntityManager()->remove($categoria);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function buscarPorNome(string $nome): ?Categoria
    {
        return $this->findOneBy(['nome' => $nome]);
    }

    public function buscarPorUuid(Uuid|string $uuid): ?Categoria
    {
        if (is_string($uuid)) {
            $uuid = Uuid::fromString($uuid);
        }

        return $this->find($uuid);
    }

    /**
     * @return array{itens: array<int, Categoria>, total: int}
     */
    public function listarPaginado(int $pagina = 1, int $limite = 20): array
    {
        $offset = ($pagina - 1) * $limite;

        $qb = $this->createQueryBuilder('c')
            ->orderBy('c.criadoEm', 'DESC')
            ->setFirstResult($offset)
            ->setMaxResults($limite);

        /** @var array<int, Categoria> $itens */
        $itens = $qb->getQuery()->getResult();

        $totalQb = $this->createQueryBuilder('c')
            ->select('COUNT(c.uuid)');

        $total = (int) $totalQb->getQuery()->getSingleScalarResult();

        return [
            'itens' => $itens,
            'total' => $total,
        ];
    }
}
