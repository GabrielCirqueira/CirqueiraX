<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\MediaItem;
use App\Enum\OrigemMedia;
use App\Enum\StatusMediaItem;
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
    public function buscarPorStatus(StatusMediaItem|string $status): array
    {
        $statusStr = is_string($status) ? $status : $status->value;

        return $this->findBy(['status' => $statusStr], ['criadoEm' => 'ASC']);
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

    /**
     * @param array{
     *     status?: StatusMediaItem|string|null,
     *     origem?: OrigemMedia|string|null,
     *     categoriaId?: string|null,
     *     busca?: string|null,
     *     ordenacao?: string|null,
     *     direcao?: string|null
     * } $filtros
     *
     * @return array{itens: array<int, MediaItem>, total: int}
     */
    public function paginarComFiltros(array $filtros = [], int $pagina = 1, int $porPagina = 20): array
    {
        $qb = $this->createQueryBuilder('m');

        if (!empty($filtros['status'])) {
            $statusVal = $filtros['status'] instanceof StatusMediaItem ? $filtros['status']->value : $filtros['status'];
            $qb->andWhere('m.status = :status')
                ->setParameter('status', $statusVal);
        }

        if (!empty($filtros['origem'])) {
            $origemVal = $filtros['origem'] instanceof OrigemMedia ? $filtros['origem']->value : $filtros['origem'];
            $qb->andWhere('m.origem = :origem')
                ->setParameter('origem', $origemVal);
        }

        if (array_key_exists('categoriaId', $filtros) && null !== $filtros['categoriaId'] && '' !== $filtros['categoriaId']) {
            if ('null' === $filtros['categoriaId'] || 'sem_categoria' === $filtros['categoriaId']) {
                $qb->andWhere('m.categoriaId IS NULL');
            } else {
                $qb->andWhere('m.categoriaId = :categoriaId')
                    ->setParameter('categoriaId', $filtros['categoriaId']);
            }
        }

        if (!empty($filtros['busca'])) {
            $qb->andWhere('m.caminhoLocal LIKE :busca OR m.hash LIKE :busca OR m.metadata LIKE :busca')
                ->setParameter('busca', '%'.$filtros['busca'].'%');
        }

        $totalQb = clone $qb;
        $total = (int) $totalQb->select('COUNT(m.uuid)')
            ->getQuery()
            ->getSingleScalarResult();

        $campoOrdenacao = match ($filtros['ordenacao'] ?? 'criadoEm') {
            'atualizadoEm' => 'm.atualizadoEm',
            'status' => 'm.status',
            'origem' => 'm.origem',
            default => 'm.criadoEm',
        };

        $direcao = 'ASC' === strtoupper($filtros['direcao'] ?? 'DESC') ? 'ASC' : 'DESC';

        $offset = max(0, ($pagina - 1) * $porPagina);

        $qb->orderBy($campoOrdenacao, $direcao)
            ->setFirstResult($offset)
            ->setMaxResults($porPagina);

        /** @var array<int, MediaItem> $itens */
        $itens = $qb->getQuery()->getResult();

        return [
            'itens' => $itens,
            'total' => $total,
        ];
    }
}
