<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ContaYoutubeOAuth;
use App\Entity\Usuario;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<ContaYoutubeOAuth>
 */
final class ContaYoutubeOAuthRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ContaYoutubeOAuth::class);
    }

    public function salvar(ContaYoutubeOAuth $conta, bool $flush = true): void
    {
        $this->getEntityManager()->persist($conta);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(ContaYoutubeOAuth $conta, bool $flush = true): void
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

    public function buscarPorUuid(Uuid|string $uuid): ?ContaYoutubeOAuth
    {
        if (is_string($uuid)) {
            if (!Uuid::isValid($uuid)) {
                return null;
            }
            $uuid = Uuid::fromString($uuid);
        }

        return $this->find($uuid);
    }

    public function buscarDoUsuario(Usuario $usuario): ?ContaYoutubeOAuth
    {
        return $this->findOneBy(['usuario' => $usuario]);
    }
}
