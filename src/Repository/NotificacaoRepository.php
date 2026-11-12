<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Notificacao;
use App\Entity\Usuario;
use DateTimeImmutable;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\ArrayParameterType;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<Notificacao>
 */
final class NotificacaoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Notificacao::class);
    }

    public function salvar(Notificacao $notificacao, bool $flush = true): void
    {
        $this->getEntityManager()->persist($notificacao);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    /**
     * @return list<Notificacao>
     */
    public function listarDoUsuario(Usuario $usuario, int $limite, bool $somenteNaoLidas): array
    {
        $consulta = $this->createQueryBuilder('n')
            ->andWhere('n.usuario = :usuario')
            ->setParameter('usuario', $usuario)
            ->orderBy('n.criadoEm', 'DESC')
            ->setMaxResults($limite);

        if ($somenteNaoLidas) {
            $consulta->andWhere('n.lidaEm IS NULL');
        }

        /** @var list<Notificacao> $notificacoes */
        $notificacoes = $consulta->getQuery()->getResult();

        return $notificacoes;
    }

    public function contarNaoLidas(Usuario $usuario): int
    {
        return (int) $this->createQueryBuilder('n')
            ->select('COUNT(n.uuid)')
            ->andWhere('n.usuario = :usuario')
            ->andWhere('n.lidaEm IS NULL')
            ->setParameter('usuario', $usuario)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * @param list<string> $uuids
     */
    public function marcarComoLidas(Usuario $usuario, array $uuids, DateTimeImmutable $lidaEm): int
    {
        $sql = 'UPDATE notificacao SET lida_em = :lidaEm WHERE usuario_id = :usuarioId AND lida_em IS NULL';
        $parametros = ['lidaEm' => $lidaEm->format('Y-m-d H:i:s'), 'usuarioId' => $usuario->getId()];
        $tipos = [];

        if ([] !== $uuids) {
            $sql .= ' AND uuid IN (:uuids)';
            $parametros['uuids'] = array_map(static fn (string $uuid): string => Uuid::fromString($uuid)->toBinary(), $uuids);
            $tipos['uuids'] = ArrayParameterType::BINARY;
        }

        return (int) $this->getEntityManager()->getConnection()->executeStatement($sql, $parametros, $tipos);
    }
}
