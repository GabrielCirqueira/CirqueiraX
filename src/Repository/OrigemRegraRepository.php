<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\OrigemRegra;
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

    public function buscarPorOrigem(string $origem): ?OrigemRegra
    {
        return $this->findOneBy(['origem' => $origem]);
    }

    public function buscarPorUuid(Uuid|string $uuid): ?OrigemRegra
    {
        if (is_string($uuid)) {
            $uuid = Uuid::fromString($uuid);
        }

        return $this->find($uuid);
    }
}
