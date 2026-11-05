<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ImportacaoSpotify;
use App\Entity\Usuario;
use App\Enum\StatusImportacaoSpotify;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<ImportacaoSpotify>
 */
final class ImportacaoSpotifyRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ImportacaoSpotify::class);
    }

    public function salvar(ImportacaoSpotify $importacao, bool $flush = true): void
    {
        $this->getEntityManager()->persist($importacao);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(ImportacaoSpotify $importacao, bool $flush = true): void
    {
        $this->getEntityManager()->remove($importacao);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorUuidEUsuario(Uuid|string $uuid, Usuario $usuario): ?ImportacaoSpotify
    {
        $uuidObj = is_string($uuid) ? Uuid::fromString($uuid) : $uuid;

        return $this->findOneBy([
            'uuid' => $uuidObj,
            'usuario' => $usuario,
        ]);
    }

    public function buscarPorUuid(Uuid|string $uuid): ?ImportacaoSpotify
    {
        $uuidObj = is_string($uuid) ? Uuid::fromString($uuid) : $uuid;

        return $this->findOneBy([
            'uuid' => $uuidObj,
        ]);
    }

    public function buscarEmAndamentoPorUsuario(Usuario $usuario): ?ImportacaoSpotify
    {
        /** @var ImportacaoSpotify|null $resultado */
        $resultado = $this->createQueryBuilder('i')
            ->andWhere('i.usuario = :usuario')
            ->andWhere('i.status IN (:statusEmAndamento)')
            ->setParameter('usuario', $usuario)
            ->setParameter('statusEmAndamento', [
                StatusImportacaoSpotify::Enviada,
                StatusImportacaoSpotify::Processando,
            ])
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        return $resultado;
    }
}
