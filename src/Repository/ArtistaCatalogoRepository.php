<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ArtistaCatalogo;
use App\Entity\Usuario;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<ArtistaCatalogo>
 */
final class ArtistaCatalogoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ArtistaCatalogo::class);
    }

    public function salvar(ArtistaCatalogo $artista, bool $flush = true): void
    {
        $this->getEntityManager()->persist($artista);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(ArtistaCatalogo $artista, bool $flush = true): void
    {
        $this->getEntityManager()->remove($artista);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorNomeNormalizado(Usuario $usuario, string $nomeNormalizado): ?ArtistaCatalogo
    {
        /** @var ArtistaCatalogo|null $resultado */
        $resultado = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.nomeNormalizado = :nomeNormalizado')
            ->setParameter('usuario', $usuario)
            ->setParameter('nomeNormalizado', $nomeNormalizado)
            ->getQuery()
            ->getOneOrNullResult();

        return $resultado;
    }

    public function buscarDoUsuario(Usuario $usuario, string $uuid): ?ArtistaCatalogo
    {
        if (!Uuid::isValid($uuid)) {
            return null;
        }

        /** @var ArtistaCatalogo|null $artista */
        $artista = $this->findOneBy(['usuario' => $usuario, 'uuid' => Uuid::fromString($uuid)]);

        return $artista;
    }

    /**
     * @return list<string>
     */
    public function listarUuidsSemFotoBuscada(Usuario $usuario): array
    {
        /** @var list<array{uuid: Uuid}> $linhas */
        $linhas = $this->createQueryBuilder('a')
            ->select('a.uuid')
            ->andWhere('a.usuario = :usuario')
            ->andWhere('a.unidoA IS NULL')
            ->andWhere('a.urlFoto IS NULL')
            ->andWhere('a.fotoBuscadaEm IS NULL')
            ->setParameter('usuario', $usuario)
            ->getQuery()
            ->getArrayResult();

        return array_map(static fn (array $linha): string => $linha['uuid']->toRfc4122(), $linhas);
    }
}
