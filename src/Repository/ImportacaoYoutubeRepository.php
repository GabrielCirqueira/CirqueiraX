<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ImportacaoYoutube;
use App\Entity\Usuario;
use App\Enum\StatusImportacaoYoutube;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<ImportacaoYoutube>
 */
final class ImportacaoYoutubeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ImportacaoYoutube::class);
    }

    public function salvar(ImportacaoYoutube $importacao, bool $flush = true): void
    {
        $this->getEntityManager()->persist($importacao);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function buscarPorUuid(string $uuid): ?ImportacaoYoutube
    {
        if (!Uuid::isValid($uuid)) {
            return null;
        }

        return $this->findOneBy(['uuid' => Uuid::fromString($uuid)]);
    }

    public function buscarDoUsuario(Usuario $usuario, string $uuid): ?ImportacaoYoutube
    {
        if (!Uuid::isValid($uuid)) {
            return null;
        }

        return $this->findOneBy(['uuid' => Uuid::fromString($uuid), 'usuario' => $usuario]);
    }

    public function buscarEmAndamento(Usuario $usuario): ?ImportacaoYoutube
    {
        /** @var ImportacaoYoutube|null $importacao */
        $importacao = $this->createQueryBuilder('i')
            ->andWhere('i.usuario = :usuario')
            ->andWhere('i.status IN (:status)')
            ->setParameter('usuario', $usuario)
            ->setParameter('status', StatusImportacaoYoutube::emAndamento())
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        return $importacao;
    }
}
