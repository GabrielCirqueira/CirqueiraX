<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Usuario;
use App\Entity\VinculoMusicaSpotify;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<VinculoMusicaSpotify>
 */
final class VinculoMusicaSpotifyRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, VinculoMusicaSpotify::class);
    }

    public function salvar(VinculoMusicaSpotify $vinculo, bool $flush = true): void
    {
        $this->getEntityManager()->persist($vinculo);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(VinculoMusicaSpotify $vinculo, bool $flush = true): void
    {
        $this->getEntityManager()->remove($vinculo);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorIdentidade(Usuario $usuario, string $nomeNormalizado, string $artistaNormalizado): ?VinculoMusicaSpotify
    {
        /** @var VinculoMusicaSpotify|null $resultado */
        $resultado = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.nomeNormalizado = :nomeNormalizado')
            ->andWhere('e.artistaNormalizado = :artistaNormalizado')
            ->setParameter('usuario', $usuario)
            ->setParameter('nomeNormalizado', $nomeNormalizado)
            ->setParameter('artistaNormalizado', $artistaNormalizado)
            ->getQuery()
            ->getOneOrNullResult();

        return $resultado;
    }
}
