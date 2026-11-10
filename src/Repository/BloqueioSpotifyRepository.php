<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\BloqueioSpotify;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<BloqueioSpotify>
 */
final class BloqueioSpotifyRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BloqueioSpotify::class);
    }

    public function salvar(BloqueioSpotify $bloqueio): void
    {
        $this->getEntityManager()->persist($bloqueio);
        $this->getEntityManager()->flush();
    }

    public function buscarUltimo(): ?BloqueioSpotify
    {
        return $this->findOneBy([], ['ocorridoEm' => 'DESC']);
    }
}
