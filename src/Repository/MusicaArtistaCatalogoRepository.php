<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\MusicaArtistaCatalogo;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<MusicaArtistaCatalogo>
 */
final class MusicaArtistaCatalogoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MusicaArtistaCatalogo::class);
    }

    public function salvar(MusicaArtistaCatalogo $vinculo, bool $flush = true): void
    {
        $this->getEntityManager()->persist($vinculo);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(MusicaArtistaCatalogo $vinculo, bool $flush = true): void
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
}
