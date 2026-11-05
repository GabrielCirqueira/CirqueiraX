<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ContaSpotify;
use App\Entity\Usuario;
use App\Enum\StatusContaSpotify;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ContaSpotify>
 */
final class ContaSpotifyRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ContaSpotify::class);
    }

    public function salvar(ContaSpotify $conta, bool $flush = true): void
    {
        $this->getEntityManager()->persist($conta);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(ContaSpotify $conta, bool $flush = true): void
    {
        $this->getEntityManager()->remove($conta);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarDoUsuario(Usuario $usuario): ?ContaSpotify
    {
        /** @var ContaSpotify|null $resultado */
        $resultado = $this->createQueryBuilder('c')
            ->andWhere('c.usuario = :usuario')
            ->setParameter('usuario', $usuario)
            ->getQuery()
            ->getOneOrNullResult();

        return $resultado;
    }

    public function buscarPorSpotifyId(string $spotifyId): ?ContaSpotify
    {
        /** @var ContaSpotify|null $resultado */
        $resultado = $this->createQueryBuilder('c')
            ->andWhere('c.spotifyId = :spotifyId')
            ->setParameter('spotifyId', $spotifyId)
            ->getQuery()
            ->getOneOrNullResult();

        return $resultado;
    }

    /**
     * @return array<int, ContaSpotify>
     */
    public function listarConectadas(): array
    {
        /** @var array<int, ContaSpotify> $resultados */
        $resultados = $this->createQueryBuilder('c')
            ->andWhere('c.status = :status')
            ->setParameter('status', StatusContaSpotify::Conectada)
            ->getQuery()
            ->getResult();

        return $resultados;
    }
}
