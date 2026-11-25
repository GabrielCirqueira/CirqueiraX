<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\LetraMusicaPronuncia;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<LetraMusicaPronuncia>
 */
final class LetraMusicaPronunciaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, LetraMusicaPronuncia::class);
    }

    public function salvar(LetraMusicaPronuncia $letra): void
    {
        $this->getEntityManager()->persist($letra);
        $this->getEntityManager()->flush();
    }

    public function buscarPorCodigoFaixa(string $codigoFaixa): ?LetraMusicaPronuncia
    {
        return $this->findOneBy(['codigoFaixa' => $codigoFaixa]);
    }

    public function buscarPorUuid(string $uuid): ?LetraMusicaPronuncia
    {
        return Uuid::isValid($uuid) ? $this->find(Uuid::fromString($uuid)) : null;
    }

    public function contar(): int
    {
        return $this->count([]);
    }
}
