<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Usuario;
use App\Entity\VinculoPlaylist;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<VinculoPlaylist>
 */
final class VinculoPlaylistRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, VinculoPlaylist::class);
    }

    public function salvar(VinculoPlaylist $vinculo, bool $flush = true): void
    {
        $this->getEntityManager()->persist($vinculo);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(VinculoPlaylist $vinculo, bool $flush = true): void
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

    public function buscarPorUuid(Uuid|string $uuid): ?VinculoPlaylist
    {
        if (is_string($uuid)) {
            if (!Uuid::isValid($uuid)) {
                return null;
            }
            $uuid = Uuid::fromString($uuid);
        }

        return $this->find($uuid);
    }

    public function buscarDoUsuarioPorUuid(Usuario $usuario, Uuid|string $uuid): ?VinculoPlaylist
    {
        $vinculo = $this->buscarPorUuid($uuid);
        if (null === $vinculo) {
            return null;
        }

        if ($vinculo->usuario()->getId() !== $usuario->getId()) {
            return null;
        }

        return $vinculo;
    }

    /**
     * @return list<VinculoPlaylist>
     */
    public function listarDoUsuario(Usuario $usuario, bool $apenasAtivos = true): array
    {
        $qb = $this->createQueryBuilder('v')
            ->andWhere('v.usuario = :usuario')
            ->setParameter('usuario', $usuario)
            ->orderBy('v.atualizadoEm', 'DESC');

        if ($apenasAtivos) {
            $qb->andWhere('v.ativo = true');
        }

        /** @var list<VinculoPlaylist> $lista */
        $lista = $qb->getQuery()->getResult();

        return $lista;
    }

    public function buscarPorIds(Usuario $usuario, string $idSpotify, string $idYoutube): ?VinculoPlaylist
    {
        /** @var VinculoPlaylist|null $vinculo */
        $vinculo = $this->findOneBy([
            'usuario' => $usuario,
            'idSpotify' => $idSpotify,
            'idYoutube' => $idYoutube,
        ]);

        return $vinculo;
    }
}
