<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ItemVinculoPlaylist;
use App\Entity\VinculoPlaylist;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<ItemVinculoPlaylist>
 */
final class ItemVinculoPlaylistRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ItemVinculoPlaylist::class);
    }

    public function salvar(ItemVinculoPlaylist $item, bool $flush = true): void
    {
        $this->getEntityManager()->persist($item);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(ItemVinculoPlaylist $item, bool $flush = true): void
    {
        $this->getEntityManager()->remove($item);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorUuid(Uuid|string $uuid): ?ItemVinculoPlaylist
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
     * @return list<ItemVinculoPlaylist>
     */
    public function listarDoVinculo(VinculoPlaylist $vinculo): array
    {
        /** @var list<ItemVinculoPlaylist> $itens */
        $itens = $this->findBy(['vinculo' => $vinculo]);

        return $itens;
    }
}
