<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\RegraCanalYoutube;
use App\Entity\Usuario;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<RegraCanalYoutube>
 */
final class RegraCanalYoutubeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RegraCanalYoutube::class);
    }

    public function salvar(RegraCanalYoutube $regra, bool $flush = true): void
    {
        $this->getEntityManager()->persist($regra);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(RegraCanalYoutube $regra, bool $flush = true): void
    {
        $this->getEntityManager()->remove($regra);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorCanal(Usuario $usuario, string $canalNormalizado): ?RegraCanalYoutube
    {
        /** @var RegraCanalYoutube|null $resultado */
        $resultado = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.canalNormalizado = :canalNormalizado')
            ->setParameter('usuario', $usuario)
            ->setParameter('canalNormalizado', $canalNormalizado)
            ->getQuery()
            ->getOneOrNullResult();

        return $resultado;
    }
}
