<?php

declare(strict_types=1);

namespace App\Repository;

use App\DataObject\PaginaRegistrosEnvioGoogleFotosDTO;
use App\Entity\RegistroEnvioGoogleFotos;
use App\Enum\StatusEnvioGoogleFotos;
use DateTimeImmutable;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<RegistroEnvioGoogleFotos>
 */
class RegistroEnvioGoogleFotosRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RegistroEnvioGoogleFotos::class);
    }

    public function salvar(RegistroEnvioGoogleFotos $registro, bool $flush = true): void
    {
        $this->getEntityManager()->persist($registro);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function buscarPorUuid(string $uuid): ?RegistroEnvioGoogleFotos
    {
        if (!Uuid::isValid($uuid)) {
            return null;
        }

        return $this->find(Uuid::fromString($uuid));
    }

    public function contarTentativasDaMidia(string $mediaItemUuid): int
    {
        return $this->count(['mediaItemUuid' => $mediaItemUuid]);
    }

    public function paginarRecentes(?StatusEnvioGoogleFotos $status, int $pagina, int $limite): PaginaRegistrosEnvioGoogleFotosDTO
    {
        $consulta = $this->createQueryBuilder('r')->orderBy('r.iniciadoEm', 'DESC');
        if (null !== $status) {
            $consulta->andWhere('r.status = :status')->setParameter('status', $status);
        }

        $total = (int) (clone $consulta)->select('COUNT(r.uuid)')->resetDQLPart('orderBy')->getQuery()->getSingleScalarResult();

        /** @var list<RegistroEnvioGoogleFotos> $registros */
        $registros = $consulta
            ->setFirstResult(($pagina - 1) * $limite)
            ->setMaxResults($limite)
            ->getQuery()
            ->getResult();

        return new PaginaRegistrosEnvioGoogleFotosDTO($registros, $total);
    }

    /**
     * @return array<string, int>
     */
    public function contarPorStatusDesde(DateTimeImmutable $desde): array
    {
        /** @var list<array{status: StatusEnvioGoogleFotos, total: int|string}> $linhas */
        $linhas = $this->createQueryBuilder('r')
            ->select('r.status AS status, COUNT(r.uuid) AS total')
            ->andWhere('r.iniciadoEm >= :desde')
            ->setParameter('desde', $desde)
            ->groupBy('r.status')
            ->getQuery()
            ->getResult();

        $contagem = [];
        foreach ($linhas as $linha) {
            $contagem[$linha['status']->value] = (int) $linha['total'];
        }

        return $contagem;
    }

    public function buscarUltimaFalha(): ?RegistroEnvioGoogleFotos
    {
        return $this->findOneBy(['status' => StatusEnvioGoogleFotos::FALHA], ['iniciadoEm' => 'DESC']);
    }
}
