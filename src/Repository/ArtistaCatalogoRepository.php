<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ArtistaCatalogo;
use App\Entity\Usuario;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ArtistaCatalogo>
 */
final class ArtistaCatalogoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ArtistaCatalogo::class);
    }

    public function salvar(ArtistaCatalogo $artista, bool $flush = true): void
    {
        $this->getEntityManager()->persist($artista);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(ArtistaCatalogo $artista, bool $flush = true): void
    {
        $this->getEntityManager()->remove($artista);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorNomeNormalizado(Usuario $usuario, string $nomeNormalizado): ?ArtistaCatalogo
    {
        /** @var ArtistaCatalogo|null $resultado */
        $resultado = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.nomeNormalizado = :nomeNormalizado')
            ->setParameter('usuario', $usuario)
            ->setParameter('nomeNormalizado', $nomeNormalizado)
            ->getQuery()
            ->getOneOrNullResult();

        return $resultado;
    }
}
