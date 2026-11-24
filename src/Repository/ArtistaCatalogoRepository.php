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

    public function buscarPorNomeNormalizado(string $nomeNormalizado): ?ArtistaCatalogo
    {
        /** @var ArtistaCatalogo|null $resultado */
        $resultado = $this->createQueryBuilder('e')
            ->andWhere('e.nomeNormalizado = :nomeNormalizado')
            ->setParameter('nomeNormalizado', $nomeNormalizado)
            ->getQuery()
            ->getOneOrNullResult();

        return $resultado;
    }

    public function buscarPorUuid(string $uuid): ?ArtistaCatalogo
    {
        if (!Uuid::isValid($uuid)) {
            return null;
        }

        /** @var ArtistaCatalogo|null $artista */
        $artista = $this->find(Uuid::fromString($uuid));

        return $artista;
    }

    /**
     * @return list<string>
     */
    public function listarUuidsSemFotoMaisOuvidosDoUsuario(Usuario $usuario, int $limite): array
    {
        $linhas = $this->getEntityManager()->getConnection()->fetchFirstColumn(
            sprintf(
                'SELECT BIN_TO_UUID(ac.uuid)
                FROM reproducao_musical r
                INNER JOIN musica_artista_catalogo mac ON mac.musica_uuid = r.musica_uuid
                INNER JOIN artista_catalogo origem ON origem.uuid = mac.artista_uuid
                INNER JOIN artista_catalogo ac ON ac.uuid = COALESCE(origem.unido_a_uuid, origem.uuid)
                WHERE r.usuario_id = :usuarioId AND ac.url_foto IS NULL AND ac.foto_buscada_em IS NULL
                GROUP BY ac.uuid
                ORDER BY COUNT(*) DESC
                LIMIT %d',
                $limite,
            ),
            ['usuarioId' => $usuario->getId()],
        );

        return array_map(static fn (mixed $uuid): string => (string) $uuid, $linhas);
    }

    /**
     * @return list<string>
     */
    public function listarUuidsSemFotoBuscada(): array
    {
        /** @var list<array{uuid: Uuid}> $linhas */
        $linhas = $this->createQueryBuilder('a')
            ->select('a.uuid')
            ->andWhere('a.unidoA IS NULL')
            ->andWhere('a.urlFoto IS NULL')
            ->andWhere('a.fotoBuscadaEm IS NULL')
            ->getQuery()
            ->getArrayResult();

        return array_map(static fn (array $linha): string => $linha['uuid']->toRfc4122(), $linhas);
    }

    /**
     * @return list<ArtistaCatalogo>
     */
    public function buscarPorTexto(string $termoNormalizado, int $limite): array
    {
        /** @var list<ArtistaCatalogo> $artistas */
        $artistas = $this->createQueryBuilder('a')
            ->andWhere('a.unidoA IS NULL')
            ->andWhere('a.nomeNormalizado LIKE :termo')
            ->setParameter('termo', '%'.addcslashes($termoNormalizado, '%_').'%')
            ->orderBy('a.nome', 'ASC')
            ->setMaxResults($limite)
            ->getQuery()
            ->getResult();

        return $artistas;
    }
}
