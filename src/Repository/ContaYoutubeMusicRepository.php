<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ContaYoutubeMusic;
use App\Entity\Usuario;
use App\Enum\FonteCapturaYoutubeMusic;
use App\Enum\StatusContaYoutubeMusic;
use DateTimeImmutable;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ContaYoutubeMusic>
 */
final class ContaYoutubeMusicRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ContaYoutubeMusic::class);
    }

    public function salvar(ContaYoutubeMusic $conta, bool $flush = true): void
    {
        $this->getEntityManager()->persist($conta);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(ContaYoutubeMusic $conta, bool $flush = true): void
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

    public function buscarDoUsuario(Usuario $usuario): ?ContaYoutubeMusic
    {
        /** @var ContaYoutubeMusic|null $resultado */
        $resultado = $this->createQueryBuilder('c')
            ->andWhere('c.usuario = :usuario')
            ->setParameter('usuario', $usuario)
            ->getQuery()
            ->getOneOrNullResult();

        return $resultado;
    }

    /**
     * @return list<ContaYoutubeMusic>
     */
    public function listarComConsultaVencida(DateTimeImmutable $agora): array
    {
        /** @var list<ContaYoutubeMusic> $contas */
        $contas = $this->createQueryBuilder('c')
            ->innerJoin('c.usuario', 'u')
            ->andWhere('u.fonteCapturaYoutubeMusic = :fonteCaptura')
            ->setParameter('fonteCaptura', FonteCapturaYoutubeMusic::Coletor)
            ->andWhere('c.status = :status')
            ->andWhere('c.credenciaisCriptografadas IS NOT NULL')
            ->andWhere('c.proximaConsultaEm IS NULL OR c.proximaConsultaEm <= :agora')
            ->setParameter('status', StatusContaYoutubeMusic::Conectada)
            ->setParameter('agora', $agora)
            ->orderBy('c.proximaConsultaEm', 'ASC')
            ->getQuery()
            ->getResult();

        return $contas;
    }
}
