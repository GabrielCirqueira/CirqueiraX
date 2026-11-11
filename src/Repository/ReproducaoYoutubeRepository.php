<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ReproducaoYoutube;
use App\Entity\Usuario;
use DateTimeImmutable;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ReproducaoYoutube>
 */
final class ReproducaoYoutubeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ReproducaoYoutube::class);
    }

    public function salvar(ReproducaoYoutube $reproducao, bool $flush = true): void
    {
        $this->getEntityManager()->persist($reproducao);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(ReproducaoYoutube $reproducao, bool $flush = true): void
    {
        $this->getEntityManager()->remove($reproducao);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    /**
     * @param list<string> $chaves
     *
     * @return list<string>
     */
    public function buscarChavesExistentes(Usuario $usuario, array $chaves): array
    {
        if ([] === $chaves) {
            return [];
        }

        /** @var list<string> $existentes */
        $existentes = $this->createQueryBuilder('e')
            ->select('e.chaveDeduplicacao')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.chaveDeduplicacao IN (:chaves)')
            ->setParameter('usuario', $usuario)
            ->setParameter('chaves', $chaves)
            ->getQuery()
            ->getSingleColumnResult();

        return $existentes;
    }

    public function buscarUltimaAntesDe(Usuario $usuario, DateTimeImmutable $momento): ?ReproducaoYoutube
    {
        /** @var ReproducaoYoutube|null $resultado */
        $resultado = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.tocadaEm < :momento')
            ->setParameter('usuario', $usuario)
            ->setParameter('momento', $momento)
            ->orderBy('e.tocadaEm', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        return $resultado;
    }

    public function contarDoUsuario(Usuario $usuario): int
    {
        return (int) $this->createQueryBuilder('e')
            ->select('COUNT(e.uuid)')
            ->andWhere('e.usuario = :usuario')
            ->setParameter('usuario', $usuario)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
