<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\AliasArtistaCatalogo;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<AliasArtistaCatalogo>
 */
final class AliasArtistaCatalogoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AliasArtistaCatalogo::class);
    }

    public function salvar(AliasArtistaCatalogo $alias, bool $flush = true): void
    {
        $this->getEntityManager()->persist($alias);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(AliasArtistaCatalogo $alias, bool $flush = true): void
    {
        $this->getEntityManager()->remove($alias);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorAlias(string $aliasNormalizado): ?AliasArtistaCatalogo
    {
        /** @var AliasArtistaCatalogo|null $resultado */
        $resultado = $this->createQueryBuilder('e')
            ->andWhere('e.aliasNormalizado = :aliasNormalizado')
            ->setParameter('aliasNormalizado', $aliasNormalizado)
            ->getQuery()
            ->getOneOrNullResult();

        return $resultado;
    }
}
