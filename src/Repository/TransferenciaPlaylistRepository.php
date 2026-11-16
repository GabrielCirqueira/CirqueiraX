<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\TransferenciaPlaylist;
use App\Entity\Usuario;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<TransferenciaPlaylist>
 */
final class TransferenciaPlaylistRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TransferenciaPlaylist::class);
    }

    public function salvar(TransferenciaPlaylist $transferencia, bool $flush = true): void
    {
        $this->getEntityManager()->persist($transferencia);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(TransferenciaPlaylist $transferencia, bool $flush = true): void
    {
        $this->getEntityManager()->remove($transferencia);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorUuid(Uuid|string $uuid): ?TransferenciaPlaylist
    {
        if (is_string($uuid)) {
            if (!Uuid::isValid($uuid)) {
                return null;
            }
            $uuid = Uuid::fromString($uuid);
        }

        return $this->find($uuid);
    }

    public function buscarDoUsuarioPorUuid(Usuario $usuario, Uuid|string $uuid): ?TransferenciaPlaylist
    {
        $transferencia = $this->buscarPorUuid($uuid);
        if (null === $transferencia) {
            return null;
        }

        if ($transferencia->usuario()->getId() !== $usuario->getId()) {
            return null;
        }

        return $transferencia;
    }

    /**
     * @return list<TransferenciaPlaylist>
     */
    public function listarDoUsuario(Usuario $usuario): array
    {
        /** @var list<TransferenciaPlaylist> $lista */
        $lista = $this->createQueryBuilder('t')
            ->andWhere('t.usuario = :usuario')
            ->setParameter('usuario', $usuario)
            ->orderBy('t.criadoEm', 'DESC')
            ->getQuery()
            ->getResult();

        return $lista;
    }
}
