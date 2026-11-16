<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\MusicaCatalogo;
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

    public function buscarPorChave(string $chaveNormalizada): ?MusicaCatalogo
    {
        /** @var MusicaCatalogo|null $resultado */
        $resultado = $this->createQueryBuilder('e')
            ->andWhere('e.chaveNormalizada = :chaveNormalizada')
            ->setParameter('chaveNormalizada', $chaveNormalizada)
            ->getQuery()
            ->getOneOrNullResult();

        return $resultado;
    }

    public function buscarPorVideoOficialId(string $videoOficialId): ?MusicaCatalogo
    {
        if ('' === trim($videoOficialId)) {
            return null;
        }

        /** @var MusicaCatalogo|null $resultado */
        $resultado = $this->createQueryBuilder('e')
            ->andWhere('e.videoOficialId = :videoOficialId')
            ->setParameter('videoOficialId', $videoOficialId)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        return $resultado?->musicaEfetiva();
    }

    public function buscarExistentePorTituloEArtistaCompactos(string $tituloCompacto, string $artistaCompacto): ?MusicaCatalogo
    {
        if ('' === $tituloCompacto || '' === $artistaCompacto) {
            return null;
        }

        $padraoArtigos = '\\b(the|os|as|o|a|de|da|do|dos|das)\\b';
        $uuidBinario = $this->getEntityManager()->getConnection()->fetchOne(
            "SELECT m.uuid
            FROM musica_catalogo m
            JOIN musica_artista_catalogo mac ON mac.musica_uuid = m.uuid
            JOIN artista_catalogo a ON a.uuid = mac.artista_uuid
            WHERE m.unida_a_uuid IS NULL
                AND m.tipo = :tipo
                AND (
                    REPLACE(SUBSTRING_INDEX(m.chave_normalizada, '|', 1), ' ', '') = :tituloCompacto
                    OR REPLACE(REGEXP_REPLACE(SUBSTRING_INDEX(m.chave_normalizada, '|', 1), :padrao, ''), ' ', '') = :tituloCompacto
                )
                AND (
                    REPLACE(a.nome_normalizado, ' ', '') = :artistaCompacto
                    OR REPLACE(REGEXP_REPLACE(a.nome_normalizado, :padrao, ''), ' ', '') = :artistaCompacto
                )
            LIMIT 1",
            [
                'tipo' => TipoMusicaCatalogo::Original->value,
                'tituloCompacto' => $tituloCompacto,
                'artistaCompacto' => $artistaCompacto,
                'padrao' => $padraoArtigos,
            ],
        );

        if (false === $uuidBinario || !is_string($uuidBinario)) {
            return null;
        }

        return $this->buscarPorUuid(Uuid::fromBinary($uuidBinario)->toRfc4122())?->musicaEfetiva();
    }

    public function liberarMemoria(): void
    {
        $this->getEntityManager()->clear();
    }

    public function buscarPorUuid(string $uuid): ?MusicaCatalogo
    {
        if (!Uuid::isValid($uuid)) {
            return null;
        }

        /** @var MusicaCatalogo|null $musica */
        $musica = $this->find(Uuid::fromString($uuid));

        return $musica;
    }

    /**
     * @return list<array{uuid: string, titulo: string, chave: string, totalArtistas: int}>
     */
    public function listarComTituloRepetido(): array
    {
        $linhas = $this->getEntityManager()->getConnection()->executeQuery(
            "SELECT m.uuid, m.titulo, m.chave_normalizada AS chave,
                (SELECT COUNT(*) FROM musica_artista_catalogo mac WHERE mac.musica_uuid = m.uuid) AS total_artistas
            FROM musica_catalogo m
            JOIN (
                SELECT SUBSTRING_INDEX(chave_normalizada, '|', 1) AS titulo_chave
                FROM musica_catalogo
                WHERE unida_a_uuid IS NULL AND tipo = :tipo
                GROUP BY titulo_chave
                HAVING COUNT(*) > 1
            ) repetidas ON repetidas.titulo_chave = SUBSTRING_INDEX(m.chave_normalizada, '|', 1)
            WHERE m.unida_a_uuid IS NULL AND m.tipo = :tipo
            ORDER BY m.chave_normalizada",
            ['tipo' => TipoMusicaCatalogo::Original->value],
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
    public function buscarPorUuids(array $uuids): array
    {
        if ([] === $uuids) {
            return [];
        }

        /** @var list<MusicaCatalogo> $musicas */
        $musicas = $this->findBy(['uuid' => array_map(static fn (string $uuid): Uuid => Uuid::fromString($uuid), $uuids)]);

        $mapa = [];
        foreach ($musicas as $musica) {
            $mapa[$musica->uuid()->toRfc4122()] = $musica;
        }

        return $mapa;
    }

    /**
     * @return list<MusicaCatalogo>
     */
    public function buscarPorTexto(string $termoNormalizado, int $limite): array
    {
        /** @var list<MusicaCatalogo> $musicas */
        $musicas = $this->createQueryBuilder('m')
            ->distinct()
            ->leftJoin('m.artistas', 'ma')
            ->leftJoin('ma.artista', 'a')
            ->andWhere('m.unidaA IS NULL')
            ->andWhere('m.chaveNormalizada LIKE :termo OR a.nomeNormalizado LIKE :termo')
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
