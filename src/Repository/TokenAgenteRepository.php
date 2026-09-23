<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\TokenAgente;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<TokenAgente>
 */
class TokenAgenteRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TokenAgente::class);
    }

    public function salvar(TokenAgente $tokenAgente, bool $flush = true): void
    {
        $this->getEntityManager()->persist($tokenAgente);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(TokenAgente $tokenAgente, bool $flush = true): void
    {
        $this->getEntityManager()->remove($tokenAgente);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function buscarPorHash(string $hash): ?TokenAgente
    {
        return $this->findOneBy([
            'tokenHash' => $hash,
            'ativo' => true,
        ]);
    }

    public function buscarPorUuid(Uuid|string $uuid): ?TokenAgente
    {
        if (is_string($uuid)) {
            $uuid = Uuid::fromString($uuid);
        }

        return $this->find($uuid);
    }
}
