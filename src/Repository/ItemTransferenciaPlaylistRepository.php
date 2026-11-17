<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ItemTransferenciaPlaylist;
use App\Entity\PlaylistTransferenciaSelecionada;
use App\Entity\TransferenciaPlaylist;
use App\Enum\StatusItemTransferenciaPlaylist;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<ItemTransferenciaPlaylist>
 */
final class ItemTransferenciaPlaylistRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ItemTransferenciaPlaylist::class);
    }

    public function salvar(ItemTransferenciaPlaylist $item, bool $flush = true): void
    {
        $this->getEntityManager()->persist($item);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorUuid(Uuid|string $uuid): ?ItemTransferenciaPlaylist
    {
        if (is_string($uuid)) {
            if (!Uuid::isValid($uuid)) {
                return null;
            }
            $uuid = Uuid::fromString($uuid);
        }

        return $this->find($uuid);
    }

    /**
     * @return list<ItemTransferenciaPlaylist>
     */
    public function listarPendentes(TransferenciaPlaylist $transferencia, int $limite = 100): array
    {
        /** @var list<ItemTransferenciaPlaylist> $itens */
        $itens = $this->createQueryBuilder('i')
            ->andWhere('IDENTITY(i.transferencia) = :transferenciaUuid')
            ->andWhere('i.status = :status')
            ->setParameter('transferenciaUuid', $transferencia->uuid(), 'uuid')
            ->setParameter('status', StatusItemTransferenciaPlaylist::Pendente)
            ->orderBy('i.ordem', 'ASC')
            ->setMaxResults($limite)
            ->getQuery()
            ->getResult();

        return $itens;
    }

    /**
     * @return list<ItemTransferenciaPlaylist>
     */
    public function listarDaTransferencia(TransferenciaPlaylist $transferencia): array
    {
        /** @var list<ItemTransferenciaPlaylist> $itens */
        $itens = $this->createQueryBuilder('i')
            ->andWhere('IDENTITY(i.transferencia) = :transferenciaUuid')
            ->setParameter('transferenciaUuid', $transferencia->uuid(), 'uuid')
            ->orderBy('i.ordem', 'ASC')
            ->getQuery()
            ->getResult();

        return $itens;
    }

    /**
     * Itens relevantes para revisão da prévia (duvidosas + não encontradas).
     * Casadas em massa ficam só nos contadores para não estourar a API.
     *
     * @return list<ItemTransferenciaPlaylist>
     */
    public function listarParaRevisaoPrevia(TransferenciaPlaylist $transferencia): array
    {
        /** @var list<ItemTransferenciaPlaylist> $itens */
        $itens = $this->createQueryBuilder('i')
            ->andWhere('IDENTITY(i.transferencia) = :transferenciaUuid')
            ->andWhere('i.status IN (:status)')
            ->setParameter('transferenciaUuid', $transferencia->uuid(), 'uuid')
            ->setParameter('status', [
                StatusItemTransferenciaPlaylist::Duvidosa,
                StatusItemTransferenciaPlaylist::NaoEncontrada,
            ])
            ->orderBy('i.ordem', 'ASC')
            ->getQuery()
            ->getResult();

        return $itens;
    }

    /**
     * @return list<ItemTransferenciaPlaylist>
     */
    public function listarProntosParaTransferirDaPlaylist(
        TransferenciaPlaylist $transferencia,
        PlaylistTransferenciaSelecionada $playlist,
    ): array
    {
        /** @var list<ItemTransferenciaPlaylist> $itens */
        $itens = $this->createQueryBuilder('i')
            ->andWhere('IDENTITY(i.transferencia) = :transferenciaUuid')
            ->andWhere('IDENTITY(i.playlistSelecionada) = :playlistUuid')
            ->andWhere('i.status IN (:status)')
            ->andWhere('i.idExternoDestino IS NOT NULL')
            ->setParameter('transferenciaUuid', $transferencia->uuid(), 'uuid')
            ->setParameter('playlistUuid', $playlist->uuid(), 'uuid')
            ->setParameter('status', [
                StatusItemTransferenciaPlaylist::Casada,
                StatusItemTransferenciaPlaylist::Duvidosa,
            ])
            ->orderBy('i.ordem', 'ASC')
            ->getQuery()
            ->getResult();

        return $itens;
    }

    /**
     * @param list<string> $uuids
     *
     * @return list<ItemTransferenciaPlaylist>
     */
    public function listarPorUuidsDaTransferencia(TransferenciaPlaylist $transferencia, array $uuids): array
    {
        if ([] === $uuids) {
            return [];
        }

        $uuidsValidos = array_values(array_filter(
            $uuids,
            static fn (string $uuid): bool => Uuid::isValid($uuid),
        ));
        if ([] === $uuidsValidos) {
            return [];
        }

        /** @var list<ItemTransferenciaPlaylist> $itens */
        $itens = $this->createQueryBuilder('i')
            ->andWhere('IDENTITY(i.transferencia) = :transferenciaUuid')
            ->andWhere('i.uuid IN (:uuids)')
            ->setParameter('transferenciaUuid', $transferencia->uuid(), 'uuid')
            ->setParameter('uuids', array_map(static fn (string $uuid): Uuid => Uuid::fromString($uuid), $uuidsValidos))
            ->getQuery()
            ->getResult();

        return $itens;
    }

    /**
     * @return array{casadas: int, duvidosas: int, naoEncontradas: int, transferidas: int, falhas: int, pendentes: int, total: int}
     */
    public function contarPorStatus(TransferenciaPlaylist $transferencia): array
    {
        $linhas = $this->createQueryBuilder('i')
            ->select('i.status AS status, COUNT(i.uuid) AS total')
            ->andWhere('IDENTITY(i.transferencia) = :transferenciaUuid')
            ->setParameter('transferenciaUuid', $transferencia->uuid(), 'uuid')
            ->groupBy('i.status')
            ->getQuery()
            ->getArrayResult();

        $contagem = [
            'casadas' => 0,
            'duvidosas' => 0,
            'naoEncontradas' => 0,
            'transferidas' => 0,
            'falhas' => 0,
            'pendentes' => 0,
            'total' => 0,
        ];

        foreach ($linhas as $linha) {
            $status = $linha['status'];
            $total = (int) $linha['total'];
            $contagem['total'] += $total;

            if (!$status instanceof StatusItemTransferenciaPlaylist) {
                continue;
            }

            match ($status) {
                StatusItemTransferenciaPlaylist::Casada => $contagem['casadas'] += $total,
                StatusItemTransferenciaPlaylist::Duvidosa => $contagem['duvidosas'] += $total,
                StatusItemTransferenciaPlaylist::NaoEncontrada => $contagem['naoEncontradas'] += $total,
                StatusItemTransferenciaPlaylist::Transferida => $contagem['transferidas'] += $total,
                StatusItemTransferenciaPlaylist::Falha => $contagem['falhas'] += $total,
                StatusItemTransferenciaPlaylist::Pendente => $contagem['pendentes'] += $total,
                StatusItemTransferenciaPlaylist::Ignorada => null,
            };
        }

        return $contagem;
    }
}
