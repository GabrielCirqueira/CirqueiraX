<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\FrasePronuncia;
use App\Entity\RelatoErroPronuncia;
use App\Enum\StatusRelatoPronuncia;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<RelatoErroPronuncia>
 */
final class RelatoErroPronunciaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RelatoErroPronuncia::class);
    }

    public function salvar(RelatoErroPronuncia $relato, bool $flush = true): void
    {
        $this->getEntityManager()->persist($relato);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorUuid(string $uuid): ?RelatoErroPronuncia
    {
        return Uuid::isValid($uuid) ? $this->find(Uuid::fromString($uuid)) : null;
    }

    /**
     * @param list<StatusRelatoPronuncia> $status
     *
     * @return list<RelatoErroPronuncia>
     */
    public function listarPorStatus(array $status, int $limite): array
    {
        /** @var list<RelatoErroPronuncia> $relatos */
        $relatos = $this->createQueryBuilder('r')
            ->addSelect('f')
            ->innerJoin('r.frase', 'f')
            ->andWhere('r.status IN (:status)')
            ->setParameter('status', $status)
            ->orderBy('r.criadoEm', 'DESC')
            ->setMaxResults($limite)
            ->getQuery()
            ->getResult();

        return $relatos;
    }

    /**
     * @return list<RelatoErroPronuncia>
     */
    public function listarEmAbertoDaFrase(FrasePronuncia $frase): array
    {
        /** @var list<RelatoErroPronuncia> $relatos */
        $relatos = $this->createQueryBuilder('r')
            ->andWhere('r.frase = :frase')
            ->andWhere('r.status IN (:status)')
            ->setParameter('frase', $frase->uuid(), UuidType::NAME)
            ->setParameter('status', StatusRelatoPronuncia::emAberto())
            ->getQuery()
            ->getResult();

        return $relatos;
    }

    public function contarEmAberto(): int
    {
        return (int) $this->createQueryBuilder('r')
            ->select('COUNT(r.uuid)')
            ->andWhere('r.status IN (:status)')
            ->setParameter('status', StatusRelatoPronuncia::emAberto())
            ->getQuery()
            ->getSingleScalarResult();
    }
}
