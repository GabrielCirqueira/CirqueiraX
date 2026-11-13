<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\EstadoProvedorIa;
use App\Enum\ProvedorIa;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<EstadoProvedorIa>
 */
final class EstadoProvedorIaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EstadoProvedorIa::class);
    }

    public function buscarOuCriar(ProvedorIa $provedor): EstadoProvedorIa
    {
        return $this->findOneBy(['provedor' => $provedor]) ?? new EstadoProvedorIa($provedor);
    }

    /**
     * @return array<string, EstadoProvedorIa>
     */
    public function listarPorProvedor(): array
    {
        $estados = [];
        foreach ($this->findAll() as $estado) {
            $estados[$estado->provedor()->value] = $estado;
        }

        return $estados;
    }

    public function salvar(EstadoProvedorIa $estado, bool $flush = true): void
    {
        $this->getEntityManager()->persist($estado);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
