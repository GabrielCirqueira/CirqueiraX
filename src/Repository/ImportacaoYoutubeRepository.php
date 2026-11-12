<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ImportacaoYoutube;
use App\Entity\Usuario;
use App\Enum\StatusImportacaoYoutube;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bridge\Doctrine\Types\UuidType;
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

    public function contarEmAndamento(Usuario $usuario): int
    {
        return (int) $this->createQueryBuilder('i')
            ->select('COUNT(i.uuid)')
            ->andWhere('i.usuario = :usuario')
            ->andWhere('i.status IN (:status)')
            ->setParameter('usuario', $usuario)
            ->setParameter('status', StatusImportacaoYoutube::emAndamento())
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function buscarAnteriorEmAndamento(ImportacaoYoutube $importacao): ?ImportacaoYoutube
    {
        /** @var ImportacaoYoutube|null $anterior */
        $anterior = $this->createQueryBuilder('i')
            ->andWhere('i.usuario = :usuario')
            ->andWhere('i.status IN (:status)')
            ->andWhere('i.criadoEm < :criadoEm OR (i.criadoEm = :criadoEm AND i.uuid < :uuid)')
            ->setParameter('usuario', $importacao->usuario())
            ->setParameter('status', StatusImportacaoYoutube::emAndamento())
            ->setParameter('uuid', $importacao->uuid(), UuidType::NAME)
            ->setParameter('criadoEm', $importacao->criadoEm())
            ->orderBy('i.criadoEm')
            ->addOrderBy('i.uuid')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        return $anterior;
    }

    /**
     * @return list<ImportacaoYoutube>
     */
    public function listarRecentes(Usuario $usuario, int $limite): array
    {
        /** @var list<ImportacaoYoutube> $importacoes */
        $importacoes = $this->createQueryBuilder('i')
            ->andWhere('i.usuario = :usuario')
            ->setParameter('usuario', $usuario)
            ->orderBy('i.criadoEm', 'DESC')
            ->setMaxResults($limite)
            ->getQuery()
            ->getResult();

        return $importacoes;
    }

    /**
     * @return list<ImportacaoYoutube>
     */
    public function listarRelatoriosNaoVistos(Usuario $usuario): array
    {
        /** @var list<ImportacaoYoutube> $importacoes */
        $importacoes = $this->createQueryBuilder('i')
            ->andWhere('i.usuario = :usuario')
            ->andWhere('i.status = :status')
            ->andWhere('i.relatorioVistoEm IS NULL')
            ->setParameter('usuario', $usuario)
            ->setParameter('status', StatusImportacaoYoutube::Concluida)
            ->orderBy('i.concluidoEm', 'ASC')
            ->getQuery()
            ->getResult();

        return $importacoes;
    }

    public function obterReferencia(ImportacaoYoutube $importacao): ImportacaoYoutube
    {
        return $this->getEntityManager()->getReference(ImportacaoYoutube::class, $importacao->uuid()) ?? $importacao;
    }

    public function limparCache(): void
    {
        $this->getEntityManager()->clear();
    }
}
