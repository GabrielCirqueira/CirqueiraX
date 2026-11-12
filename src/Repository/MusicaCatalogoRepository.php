<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\MusicaCatalogo;
use App\Entity\Usuario;
use App\Enum\TipoMusicaCatalogo;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<MusicaCatalogo>
 */
final class MusicaCatalogoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MusicaCatalogo::class);
    }

    public function salvar(MusicaCatalogo $musica, bool $flush = true): void
    {
        $this->getEntityManager()->persist($musica);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(MusicaCatalogo $musica, bool $flush = true): void
    {
        $this->getEntityManager()->remove($musica);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorChave(Usuario $usuario, string $chaveNormalizada): ?MusicaCatalogo
    {
        /** @var MusicaCatalogo|null $resultado */
        $resultado = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.chaveNormalizada = :chaveNormalizada')
            ->setParameter('usuario', $usuario)
            ->setParameter('chaveNormalizada', $chaveNormalizada)
            ->getQuery()
            ->getOneOrNullResult();

        return $resultado;
    }

    public function liberarMemoria(): void
    {
        $this->getEntityManager()->clear();
    }

    public function buscarDoUsuario(Usuario $usuario, string $uuid): ?MusicaCatalogo
    {
        if (!Uuid::isValid($uuid)) {
            return null;
        }

        /** @var MusicaCatalogo|null $musica */
        $musica = $this->findOneBy(['usuario' => $usuario, 'uuid' => Uuid::fromString($uuid)]);

        return $musica;
    }

    /**
     * @return list<array{uuid: string, titulo: string, chave: string, totalArtistas: int}>
     */
    public function listarComTituloRepetido(Usuario $usuario): array
    {
        $linhas = $this->getEntityManager()->getConnection()->executeQuery(
            "SELECT m.uuid, m.titulo, m.chave_normalizada AS chave,
                (SELECT COUNT(*) FROM musica_artista_catalogo mac WHERE mac.musica_uuid = m.uuid) AS total_artistas
            FROM musica_catalogo m
            JOIN (
                SELECT SUBSTRING_INDEX(chave_normalizada, '|', 1) AS titulo_chave
                FROM musica_catalogo
                WHERE usuario_id = :usuarioId AND unida_a_uuid IS NULL AND tipo = :tipo
                GROUP BY titulo_chave
                HAVING COUNT(*) > 1
            ) repetidas ON repetidas.titulo_chave = SUBSTRING_INDEX(m.chave_normalizada, '|', 1)
            WHERE m.usuario_id = :usuarioId AND m.unida_a_uuid IS NULL AND m.tipo = :tipo
            ORDER BY m.chave_normalizada",
            ['usuarioId' => $usuario->getId(), 'tipo' => TipoMusicaCatalogo::Original->value],
        )->fetchAllAssociative();

        return array_map(static fn (array $linha): array => [
            'uuid' => Uuid::fromBinary((string) $linha['uuid'])->toRfc4122(),
            'titulo' => (string) $linha['titulo'],
            'chave' => (string) $linha['chave'],
            'totalArtistas' => (int) $linha['total_artistas'],
        ], $linhas);
    }

    /**
     * @param list<string> $uuids
     *
     * @return array<string, MusicaCatalogo>
     */
    public function buscarPorUuids(Usuario $usuario, array $uuids): array
    {
        if ([] === $uuids) {
            return [];
        }

        /** @var list<MusicaCatalogo> $musicas */
        $musicas = $this->findBy(['usuario' => $usuario, 'uuid' => array_map(static fn (string $uuid): Uuid => Uuid::fromString($uuid), $uuids)]);

        $mapa = [];
        foreach ($musicas as $musica) {
            $mapa[$musica->uuid()->toRfc4122()] = $musica;
        }

        return $mapa;
    }

    /**
     * @return list<MusicaCatalogo>
     */
    public function buscarPorTexto(Usuario $usuario, string $termoNormalizado, int $limite): array
    {
        /** @var list<MusicaCatalogo> $musicas */
        $musicas = $this->createQueryBuilder('m')
            ->distinct()
            ->leftJoin('m.artistas', 'ma')
            ->leftJoin('ma.artista', 'a')
            ->andWhere('m.usuario = :usuario')
            ->andWhere('m.unidaA IS NULL')
            ->andWhere('m.chaveNormalizada LIKE :termo OR a.nomeNormalizado LIKE :termo')
            ->setParameter('usuario', $usuario)
            ->setParameter('termo', '%'.addcslashes($termoNormalizado, '%_').'%')
            ->orderBy('m.titulo', 'ASC')
            ->setMaxResults($limite)
            ->getQuery()
            ->getResult();

        return $musicas;
    }

    public function isUrlCapaConhecida(string $url): bool
    {
        return false !== $this->getEntityManager()->getConnection()->fetchOne(
            'SELECT 1 FROM musica_catalogo WHERE url_capa = :url
            UNION ALL SELECT 1 FROM video_youtube WHERE url_capa = :url
            UNION ALL SELECT 1 FROM artista_catalogo WHERE url_foto = :url
            UNION ALL SELECT 1 FROM imagem_spotify WHERE :url IN (imagem_grande_url, imagem_media_url, imagem_pequena_url)
            LIMIT 1',
            ['url' => $url],
        );
    }
}
