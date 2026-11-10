<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ContaGoogleFotos;
use App\Entity\Usuario;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<ContaGoogleFotos>
 */
class ContaGoogleFotosRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ContaGoogleFotos::class);
    }

    public function salvar(ContaGoogleFotos $conta, bool $flush = true): void
    {
        $this->getEntityManager()->persist($conta);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(ContaGoogleFotos $conta, bool $flush = true): void
    {
        $this->getEntityManager()->remove($conta);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function buscarPorUuid(Uuid|string $uuid): ?ContaGoogleFotos
    {
        if (is_string($uuid)) {
            $uuid = Uuid::fromString($uuid);
        }

        return $this->find($uuid);
    }

    public function buscarDoUsuario(Usuario $usuario): ?ContaGoogleFotos
    {
        return $this->findOneBy(['usuario' => $usuario]);
    }
}
