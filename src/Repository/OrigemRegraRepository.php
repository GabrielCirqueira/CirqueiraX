<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\OrigemRegra;
use App\Enum\OrigemMedia;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<OrigemRegra>
 */
class OrigemRegraRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, OrigemRegra::class);
    }

    public function salvar(OrigemRegra $regra, bool $flush = true): void
    {
        $this->getEntityManager()->persist($regra);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(OrigemRegra $regra, bool $flush = true): void
    {
        $this->getEntityManager()->remove($regra);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function buscarPorOrigem(OrigemMedia|string $origem): ?OrigemRegra
    {
        $valor = $origem instanceof OrigemMedia ? $origem->value : $origem;

        return $this->findOneBy(['origem' => $valor]);
    }

    public function buscarPorUuid(Uuid|string $uuid): ?OrigemRegra
    {
        if (is_string($uuid)) {
            $uuid = Uuid::fromString($uuid);
        }

        return $this->find($uuid);
    }

    public function existeComOrigem(OrigemMedia|string $origem, Uuid|string|null $ignorarUuid = null): bool
    {
        $valor = $origem instanceof OrigemMedia ? $origem->value : $origem;
        $qb = $this->createQueryBuilder('r')
            ->select('COUNT(r.uuid)')
            ->where('r.origem = :origem')
            ->setParameter('origem', $valor);

        if (null !== $ignorarUuid) {
            $uuidStr = is_string($ignorarUuid) ? $ignorarUuid : $ignorarUuid->toString();
            $qb->andWhere('r.uuid != :ignorarUuid')
               ->setParameter('ignorarUuid', $uuidStr);
        }

        return (int) $qb->getQuery()->getSingleScalarResult() > 0;
    }

    /**
     * @return list<OrigemRegra>
     */
    public function listarTodas(): array
    {
        /** @var list<OrigemRegra> $resultado */
        $resultado = $this->findBy([], ['criadoEm' => 'DESC']);

        return $resultado;
    }

    /**
     * @return array{itens: array<int, OrigemRegra>, total: int}
     */
    public function listarPaginado(int $pagina = 1, int $limite = 20): array
    {
        $offset = ($pagina - 1) * $limite;

        $qb = $this->createQueryBuilder('r')
            ->orderBy('r.criadoEm', 'DESC')
            ->setFirstResult($offset)
            ->setMaxResults($limite);

        /** @var array<int, OrigemRegra> $itens */
        $itens = $qb->getQuery()->getResult();

        $totalQb = $this->createQueryBuilder('r')
            ->select('COUNT(r.uuid)');

        $total = (int) $totalQb->getQuery()->getSingleScalarResult();

        return [
            'itens' => $itens,
            'total' => $total,
        ];
    }
}
