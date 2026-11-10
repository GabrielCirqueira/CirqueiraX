<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\OrigemRegra;
use App\Entity\Usuario;
use App\Enum\OrigemMedia;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<OrigemRegra>
 */
class OrigemRegraRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, OrigemRegra::class);
    }

    public function salvar(OrigemRegra $regra, bool $flush = true): void
    {
        $this->getEntityManager()->persist($regra);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(OrigemRegra $regra, bool $flush = true): void
    {
        $this->getEntityManager()->remove($regra);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function buscarPorOrigem(Usuario $usuario, OrigemMedia|string $origem): ?OrigemRegra
    {
        $valor = $origem instanceof OrigemMedia ? $origem->value : $origem;

        return $this->findOneBy(['usuario' => $usuario, 'origem' => $valor]);
    }

    public function buscarDoUsuario(Uuid|string $uuid, Usuario $usuario): ?OrigemRegra
    {
        if (is_string($uuid) && !Uuid::isValid($uuid)) {
            return null;
        }

        return $this->findOneBy(['uuid' => is_string($uuid) ? Uuid::fromString($uuid) : $uuid, 'usuario' => $usuario]);
    }

    public function buscarPorUuid(Uuid|string $uuid): ?OrigemRegra
    {
        if (is_string($uuid)) {
            $uuid = Uuid::fromString($uuid);
        }

        return $this->find($uuid);
    }

    public function existeComOrigem(Usuario $usuario, OrigemMedia|string $origem, Uuid|string|null $ignorarUuid = null): bool
    {
        $valor = $origem instanceof OrigemMedia ? $origem->value : $origem;
        $qb = $this->createQueryBuilder('r')
            ->select('COUNT(r.uuid)')
            ->where('r.usuario = :usuario')
            ->andWhere('r.origem = :origem')
            ->setParameter('usuario', $usuario)
            ->setParameter('origem', $valor);

        if (null !== $ignorarUuid) {
            $uuidStr = is_string($ignorarUuid) ? $ignorarUuid : $ignorarUuid->toString();
            $qb->andWhere('r.uuid != :ignorarUuid')
               ->setParameter('ignorarUuid', $uuidStr);
        }

        return (int) $qb->getQuery()->getSingleScalarResult() > 0;
    }

    /**
     * @return list<OrigemRegra>
     */
    public function listarTodas(Usuario $usuario): array
    {
        /** @var list<OrigemRegra> $resultado */
        $resultado = $this->findBy(['usuario' => $usuario], ['criadoEm' => 'DESC']);

        return $resultado;
    }
}
