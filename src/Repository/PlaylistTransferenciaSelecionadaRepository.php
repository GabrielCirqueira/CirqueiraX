<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\PlaylistTransferenciaSelecionada;
use App\Entity\TransferenciaPlaylist;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<PlaylistTransferenciaSelecionada>
 */
final class PlaylistTransferenciaSelecionadaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PlaylistTransferenciaSelecionada::class);
    }

    public function salvar(PlaylistTransferenciaSelecionada $playlist, bool $flush = true): void
    {
        $this->getEntityManager()->persist($playlist);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorUuid(Uuid|string $uuid): ?PlaylistTransferenciaSelecionada
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
     * @return list<PlaylistTransferenciaSelecionada>
     */
    public function listarDaTransferencia(TransferenciaPlaylist $transferencia): array
    {
        /** @var list<PlaylistTransferenciaSelecionada> $lista */
        $lista = $this->findBy(['transferencia' => $transferencia]);

        return $lista;
    }
}
