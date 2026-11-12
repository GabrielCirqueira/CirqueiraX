<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Usuario;
use App\Entity\VideoYoutube;
use App\Enum\OrigemClassificacao;
use App\Enum\StatusClassificacaoVideo;
use App\Enum\TipoRevisaoMusica;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\ArrayParameterType;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<VideoYoutube>
 */
final class VideoYoutubeRepository extends ServiceEntityRepository
{
    private const string SEPARADOR_AGRUPAMENTO = "\x1F";

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, VideoYoutube::class);
    }

    public function salvar(VideoYoutube $video, bool $flush = true): void
    {
        $this->getEntityManager()->persist($video);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(VideoYoutube $video, bool $flush = true): void
    {
        $this->getEntityManager()->remove($video);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorVideoId(Usuario $usuario, string $videoId): ?VideoYoutube
    {
        /** @var VideoYoutube|null $resultado */
        $resultado = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.videoId = :videoId')
            ->setParameter('usuario', $usuario)
            ->setParameter('videoId', $videoId)
            ->getQuery()
            ->getOneOrNullResult();

        return $resultado;
    }

    /**
     * @param list<string> $videoIds
     *
     * @return array<string, VideoYoutube>
     */
    public function buscarPorVideoIds(Usuario $usuario, array $videoIds): array
    {
        if ([] === $videoIds) {
            return [];
        }

        /** @var list<VideoYoutube> $videos */
        $videos = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.videoId IN (:videoIds)')
            ->setParameter('usuario', $usuario)
            ->setParameter('videoIds', array_values(array_unique($videoIds)))
            ->getQuery()
            ->getResult();

        $mapa = [];
        foreach ($videos as $video) {
            $mapa[$video->videoId()] = $video;
        }

        return $mapa;
    }

    /**
     * @return list<VideoYoutube>
     */
    public function listarPendentes(Usuario $usuario, int $limite): array
    {
        /** @var list<VideoYoutube> $videos */
        $videos = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.status = :status')
            ->setParameter('usuario', $usuario)
            ->setParameter('status', StatusClassificacaoVideo::Pendente)
            ->orderBy('e.criadoEm', 'ASC')
            ->andWhere('e.aguardandoImportacao = false')
            ->setMaxResults($limite)
            ->getQuery()
            ->getResult();

        return $videos;
    }

    /**
     * @return list<VideoYoutube>
     */
    public function listarDoCanal(Usuario $usuario, string $canal): array
    {
        /** @var list<VideoYoutube> $videos */
        $videos = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.canal = :canal')
            ->setParameter('usuario', $usuario)
            ->setParameter('canal', $canal)
            ->getQuery()
            ->getResult();

        return $videos;
    }

    /**
     * @return list<VideoYoutube>
     */
    public function listarComDetalhesVencidos(\DateTimeImmutable $atualizadosAntesDe, int $limite): array
    {
        /** @var list<VideoYoutube> $videos */
        $videos = $this->createQueryBuilder('e')
            ->andWhere('e.detalhesAtualizadosEm IS NULL OR e.detalhesAtualizadosEm < :limite')
            ->setParameter('limite', $atualizadosAntesDe)
            ->orderBy('e.detalhesAtualizadosEm', 'ASC')
            ->addOrderBy('e.criadoEm', 'ASC')
            ->andWhere('e.aguardandoImportacao = false')
            ->setMaxResults($limite)
            ->getQuery()
            ->getResult();

        return $videos;
    }

    /**
     * @return list<VideoYoutube>
     */
    public function listarPendentesDeTodos(int $limite): array
    {
        /** @var list<VideoYoutube> $videos */
        $videos = $this->createQueryBuilder('e')
            ->andWhere('e.status = :status')
            ->setParameter('status', StatusClassificacaoVideo::Pendente)
            ->orderBy('e.criadoEm', 'ASC')
            ->andWhere('e.aguardandoImportacao = false')
            ->setMaxResults($limite)
            ->getQuery()
            ->getResult();

        return $videos;
    }

    /**
     * @return list<VideoYoutube>
     */
    public function listarParaReidentificar(Usuario $usuario, int $limite): array
    {
        /** @var list<VideoYoutube> $videos */
        $videos = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.origemClassificacao IS NULL OR e.origemClassificacao != :manual')
            ->andWhere('e.status != :indisponivel')
            ->setParameter('usuario', $usuario)
            ->setParameter('manual', OrigemClassificacao::Manual)
            ->setParameter('indisponivel', StatusClassificacaoVideo::Indisponivel)
            ->orderBy('e.classificadoEm', 'ASC')
            ->setMaxResults($limite)
            ->getQuery()
            ->getResult();

        return $videos;
    }

    public function buscarDoUsuario(Usuario $usuario, string $uuid): ?VideoYoutube
    {
        if (!Uuid::isValid($uuid)) {
            return null;
        }

        /** @var VideoYoutube|null $video */
        $video = $this->findOneBy(['usuario' => $usuario, 'uuid' => Uuid::fromString($uuid)]);

        return $video;
    }

    /**
     * @return array{uuids: list<string>, total: int}
     */
    public function listarParaRevisao(Usuario $usuario, TipoRevisaoMusica $tipo, int $deslocamento, int $limite): array
    {
        $condicao = $this->condicaoRevisao($tipo);
        $conexao = $this->getEntityManager()->getConnection();
        $parametros = ['usuarioId' => $usuario->getId(), 'deslocamento' => $deslocamento, 'limite' => $limite];
        $tipos = ['deslocamento' => \PDO::PARAM_INT, 'limite' => \PDO::PARAM_INT];

        $total = (int) $conexao->fetchOne("SELECT COUNT(*) FROM video_youtube WHERE usuario_id = :usuarioId AND {$condicao}", $parametros, $tipos);
        $linhas = $conexao->fetchFirstColumn(
            "SELECT uuid FROM video_youtube WHERE usuario_id = :usuarioId AND {$condicao} ORDER BY atualizado_em DESC LIMIT :deslocamento, :limite",
            $parametros,
            $tipos,
        );

        return ['uuids' => array_map(static fn (mixed $uuid): string => Uuid::fromBinary((string) $uuid)->toRfc4122(), $linhas), 'total' => $total];
    }

    /**
     * @return list<array{canal: string, canalId: string|null, total: int, exemplo: string, exemploVideoId: string|null}>
     */
    public function listarCanaisEmAberto(Usuario $usuario): array
    {
        $linhas = $this->getEntityManager()->getConnection()->executeQuery(
            "SELECT canal, COUNT(*) AS total, MAX(canal_id) AS canal_id,
                SUBSTRING_INDEX(GROUP_CONCAT(titulo ORDER BY atualizado_em DESC SEPARATOR :separador), :separador, 1) AS exemplo,
                SUBSTRING_INDEX(GROUP_CONCAT(video_id ORDER BY atualizado_em DESC SEPARATOR :separador), :separador, 1) AS exemplo_video_id
            FROM video_youtube
            WHERE usuario_id = :usuarioId
                AND status IN ('pendente', 'revisar', 'compilacao')
                AND (origem_classificacao IS NULL OR origem_classificacao <> 'manual')
                AND canal <> ''
            GROUP BY canal
            ORDER BY total DESC, canal",
            ['usuarioId' => $usuario->getId(), 'separador' => self::SEPARADOR_AGRUPAMENTO],
        )->fetchAllAssociative();

        return array_map(static fn (array $linha): array => [
            'canal' => (string) $linha['canal'],
            'canalId' => null === $linha['canal_id'] || '' === $linha['canal_id'] ? null : (string) $linha['canal_id'],
            'total' => (int) $linha['total'],
            'exemplo' => (string) $linha['exemplo'],
            'exemploVideoId' => null === $linha['exemplo_video_id'] ? null : (string) $linha['exemplo_video_id'],
        ], $linhas);
    }

    /**
     * @param list<string> $musicaUuids
     *
     * @return array<string, array{videoId: string, titulo: string, canal: string, urlCapa: string|null, reproducoes: int}>
     */
    public function mapearVideoPrincipalPorMusica(Usuario $usuario, array $musicaUuids): array
    {
        if ([] === $musicaUuids) {
            return [];
        }

        $linhas = $this->getEntityManager()->getConnection()->executeQuery(
            'SELECT musica_uuid, video_id, titulo, canal, url_capa, reproducoes FROM (
                SELECT v.musica_catalogo_uuid AS musica_uuid, v.video_id, v.titulo, v.canal, v.url_capa,
                    COUNT(r.uuid) AS reproducoes,
                    ROW_NUMBER() OVER (PARTITION BY v.musica_catalogo_uuid ORDER BY COUNT(r.uuid) DESC, v.atualizado_em DESC) AS posicao
                FROM video_youtube v
                LEFT JOIN reproducao_youtube r ON r.video_uuid = v.uuid
                WHERE v.usuario_id = :usuarioId AND v.musica_catalogo_uuid IN (:musicas)
                GROUP BY v.uuid
            ) ranqueados WHERE posicao = 1',
            [
                'usuarioId' => $usuario->getId(),
                'musicas' => array_map(static fn (string $uuid): string => Uuid::fromString($uuid)->toBinary(), $musicaUuids),
            ],
            ['musicas' => ArrayParameterType::BINARY],
        )->fetchAllAssociative();

        $mapa = [];
        foreach ($linhas as $linha) {
            $mapa[Uuid::fromBinary((string) $linha['musica_uuid'])->toRfc4122()] = [
                'videoId' => (string) $linha['video_id'],
                'titulo' => (string) $linha['titulo'],
                'canal' => (string) $linha['canal'],
                'urlCapa' => null === $linha['url_capa'] ? null : (string) $linha['url_capa'],
                'reproducoes' => (int) $linha['reproducoes'],
            ];
        }

        return $mapa;
    }

    /**
     * @param list<string> $uuids
     *
     * @return list<VideoYoutube>
     */
    public function buscarPorUuidsOrdenados(Usuario $usuario, array $uuids): array
    {
        if ([] === $uuids) {
            return [];
        }

        /** @var list<VideoYoutube> $videos */
        $videos = $this->findBy(['usuario' => $usuario, 'uuid' => array_map(static fn (string $uuid): Uuid => Uuid::fromString($uuid), $uuids)]);
        $ordem = array_flip($uuids);
        usort($videos, static fn (VideoYoutube $a, VideoYoutube $b): int => $ordem[$a->uuid()->toRfc4122()] <=> $ordem[$b->uuid()->toRfc4122()]);

        return $videos;
    }

    /**
     * @return list<VideoYoutube>
     */
    public function listarReservadosSemDetalhes(Usuario $usuario, int $limite): array
    {
        /** @var list<VideoYoutube> $videos */
        $videos = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.aguardandoImportacao = true')
            ->andWhere('e.status = :status')
            ->andWhere('e.detalhesAtualizadosEm IS NULL')
            ->setParameter('usuario', $usuario)
            ->setParameter('status', StatusClassificacaoVideo::Pendente)
            ->orderBy('e.uuid', 'ASC')
            ->setMaxResults($limite)
            ->getQuery()
            ->getResult();

        return $videos;
    }

    /**
     * @return list<VideoYoutube>
     */
    public function listarReservadosPendentes(Usuario $usuario, ?Uuid $depoisDe, int $limite): array
    {
        $consulta = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.aguardandoImportacao = true')
            ->andWhere('e.status = :status')
            ->setParameter('usuario', $usuario)
            ->setParameter('status', StatusClassificacaoVideo::Pendente)
            ->orderBy('e.uuid', 'ASC')
            ->setMaxResults($limite);

        if (null !== $depoisDe) {
            $consulta->andWhere('e.uuid > :depoisDe')->setParameter('depoisDe', $depoisDe, UuidType::NAME);
        }

        /** @var list<VideoYoutube> $videos */
        $videos = $consulta->getQuery()->getResult();

        return $videos;
    }

    /**
     * @return array<string, int>
     */
    public function contarPorStatus(Usuario $usuario): array
    {
        /** @var list<array{status: StatusClassificacaoVideo, total: int|string}> $linhas */
        $linhas = $this->createQueryBuilder('e')
            ->select('e.status AS status, COUNT(e.uuid) AS total')
            ->andWhere('e.usuario = :usuario')
            ->setParameter('usuario', $usuario)
            ->groupBy('e.status')
            ->getQuery()
            ->getResult();

        $totais = [];
        foreach ($linhas as $linha) {
            $totais[$linha['status']->value] = (int) $linha['total'];
        }

        return $totais;
    }

    /**
     * @return array<string, int>
     */
    public function contarReservadosPorStatus(Usuario $usuario): array
    {
        /** @var list<array{status: StatusClassificacaoVideo, total: int|string}> $linhas */
        $linhas = $this->createQueryBuilder('e')
            ->select('e.status AS status, COUNT(e.uuid) AS total')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.aguardandoImportacao = true')
            ->setParameter('usuario', $usuario)
            ->groupBy('e.status')
            ->getQuery()
            ->getResult();

        $totais = [];
        foreach ($linhas as $linha) {
            $totais[$linha['status']->value] = (int) $linha['total'];
        }

        return $totais;
    }

    public function contarReservadosPendentesFaixaOficial(Usuario $usuario, string $sufixoCanal): int
    {
        return (int) $this->createQueryBuilder('e')
            ->select('COUNT(e.uuid)')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.aguardandoImportacao = true')
            ->andWhere('e.status = :status')
            ->andWhere('e.canal LIKE :sufixo')
            ->setParameter('usuario', $usuario)
            ->setParameter('status', StatusClassificacaoVideo::Pendente)
            ->setParameter('sufixo', '%'.$sufixoCanal)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function liberarReservadosResolvidos(Usuario $usuario): int
    {
        return (int) $this->createQueryBuilder('e')
            ->update()
            ->set('e.aguardandoImportacao', 'false')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.aguardandoImportacao = true')
            ->andWhere('e.status != :status')
            ->setParameter('usuario', $usuario)
            ->setParameter('status', StatusClassificacaoVideo::Pendente)
            ->getQuery()
            ->execute();
    }

    public function liberarTodosReservados(Usuario $usuario): int
    {
        return (int) $this->createQueryBuilder('e')
            ->update()
            ->set('e.aguardandoImportacao', 'false')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.aguardandoImportacao = true')
            ->setParameter('usuario', $usuario)
            ->getQuery()
            ->execute();
    }

    public function limparCache(): void
    {
        $this->getEntityManager()->clear();
    }

    public function contarParaRevisao(Usuario $usuario, TipoRevisaoMusica $tipo): int
    {
        $condicao = $this->condicaoRevisao($tipo);

        return (int) $this->getEntityManager()->getConnection()->fetchOne(
            "SELECT COUNT(*) FROM video_youtube WHERE usuario_id = :usuarioId AND {$condicao}",
            ['usuarioId' => $usuario->getId()],
        );
    }

    private function condicaoRevisao(TipoRevisaoMusica $tipo): string
    {
        return match ($tipo) {
            TipoRevisaoMusica::Ambiguo => "status = 'revisar' AND JSON_EXTRACT(resposta_ia, '$.ambiguo') = true",
            TipoRevisaoMusica::Compilacao => "status = 'compilacao' AND (origem_classificacao IS NULL OR origem_classificacao <> 'manual')",
            TipoRevisaoMusica::Indisponivel => "status = 'indisponivel'",
            default => "(status = 'pendente' OR (status = 'revisar' AND (resposta_ia IS NULL OR JSON_EXTRACT(resposta_ia, '$.ambiguo') IS NULL OR JSON_EXTRACT(resposta_ia, '$.ambiguo') = false)))",
        };
    }
}
