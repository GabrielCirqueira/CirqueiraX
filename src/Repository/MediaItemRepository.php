<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\MediaItem;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<MediaItem>
 */
class MediaItemRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MediaItem::class);
    }

    public function salvar(MediaItem $mediaItem, bool $flush = true): void
    {
        $this->getEntityManager()->persist($mediaItem);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(MediaItem $mediaItem, bool $flush = true): void
    {
        $this->getEntityManager()->remove($mediaItem);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function buscarPorHash(string $hash): ?MediaItem
    {
        return $this->findOneBy(['hash' => $hash]);
    }

    public function buscarPorUuid(Uuid|string $uuid): ?MediaItem
    {
        if (is_string($uuid)) {
            $uuid = Uuid::fromString($uuid);
        }

        return $this->find($uuid);
    }

    /**
     * @return list<MediaItem>
     */
    public function buscarPorStatus(string $status): array
    {
        return $this->findBy(['status' => $status], ['criadoEm' => 'ASC']);
    }

    /**
     * @return array{itens: array<int, MediaItem>, total: int}
     */
    public function listarPaginado(int $pagina = 1, int $limite = 20): array
    {
        $offset = ($pagina - 1) * $limite;

        $qb = $this->createQueryBuilder('m')
            ->orderBy('m.criadoEm', 'DESC')
            ->setFirstResult($offset)
            ->setMaxResults($limite);

        /** @var array<int, MediaItem> $itens */
        $itens = $qb->getQuery()->getResult();

        $totalQb = $this->createQueryBuilder('m')
            ->select('COUNT(m.uuid)');

        $total = (int) $totalQb->getQuery()->getSingleScalarResult();

        return [
            'itens' => $itens,
            'total' => $total,
        ];
    }
}
