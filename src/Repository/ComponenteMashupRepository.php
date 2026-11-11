<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ComponenteMashup;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ComponenteMashup>
 */
final class ComponenteMashupRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ComponenteMashup::class);
    }

    public function salvar(ComponenteMashup $componente, bool $flush = true): void
    {
        $this->getEntityManager()->persist($componente);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(ComponenteMashup $componente, bool $flush = true): void
    {
        $this->getEntityManager()->remove($componente);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }
}
