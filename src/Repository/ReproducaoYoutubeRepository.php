<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ImportacaoYoutube;
use App\Entity\ReproducaoYoutube;
use App\Entity\Usuario;
use App\Entity\VideoYoutube;
use App\Enum\FonteReproducaoYoutube;
use DateTimeImmutable;
use DateTimeZone;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\ParameterType;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ReproducaoYoutube>
 */
final class ReproducaoYoutubeRepository extends ServiceEntityRepository
{
    private const string FORMATO_MOMENTO_BANCO = 'Y-m-d H:i:s';

    private const string FUSO_UTC = 'UTC';

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ReproducaoYoutube::class);
    }

    public function salvar(ReproducaoYoutube $reproducao, bool $flush = true): void
    {
        $this->getEntityManager()->persist($reproducao);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(ReproducaoYoutube $reproducao, bool $flush = true): void
    {
        $this->getEntityManager()->remove($reproducao);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    /**
     * @param list<string> $chaves
     *
     * @return list<string>
     */
    public function buscarChavesExistentes(Usuario $usuario, array $chaves): array
    {
        if ([] === $chaves) {
            return [];
        }

        /** @var list<string> $existentes */
        $existentes = $this->createQueryBuilder('e')
            ->select('e.chaveDeduplicacao')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.chaveDeduplicacao IN (:chaves)')
            ->setParameter('usuario', $usuario)
            ->setParameter('chaves', $chaves)
            ->getQuery()
            ->getSingleColumnResult();

        return $existentes;
    }

    /**
     * @param list<FonteReproducaoYoutube> $fontes
     * @param list<string>                 $videoIds
     *
     * @return list<ReproducaoYoutube>
     */
    public function listarDasFontesNoIntervalo(Usuario $usuario, array $fontes, array $videoIds, DateTimeImmutable $inicio, DateTimeImmutable $fim): array
    {
        if ([] === $videoIds) {
            return [];
        }

        /** @var list<ReproducaoYoutube> $reproducoes */
        $reproducoes = $this->createQueryBuilder('e')
            ->innerJoin('e.video', 'v')
            ->addSelect('v')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.fonte IN (:fontes)')
            ->andWhere('v.videoId IN (:videoIds)')
            ->andWhere('e.tocadaEm BETWEEN :inicio AND :fim')
            ->setParameter('usuario', $usuario)
            ->setParameter('fontes', array_map(static fn (FonteReproducaoYoutube $fonte): string => $fonte->value, $fontes))
            ->setParameter('videoIds', array_values(array_unique($videoIds)))
            ->setParameter('inicio', $inicio)
            ->setParameter('fim', $fim)
            ->orderBy('e.tocadaEm', 'ASC')
            ->getQuery()
            ->getResult();

        return $reproducoes;
    }

    public function buscarDaExtensao(Usuario $usuario, string $idExtensao): ?ReproducaoYoutube
    {
        /** @var ReproducaoYoutube|null $reproducao */
        $reproducao = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.idExtensao = :idExtensao')
            ->setParameter('usuario', $usuario)
            ->setParameter('idExtensao', $idExtensao)
            ->getQuery()
            ->getOneOrNullResult();

        return $reproducao;
    }

    /**
     * @return list<ReproducaoYoutube>
     */
    public function listarEstimadasDoVideoNoIntervalo(Usuario $usuario, VideoYoutube $video, DateTimeImmutable $inicio, DateTimeImmutable $fim): array
    {
        /** @var list<ReproducaoYoutube> $reproducoes */
        $reproducoes = $this->createQueryBuilder('e')
            ->innerJoin('e.video', 'v')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('v.videoId = :videoId')
            ->andWhere('e.tempoExato = false')
            ->andWhere('e.idExtensao IS NULL')
            ->andWhere('e.tocadaEm BETWEEN :inicio AND :fim')
            ->setParameter('usuario', $usuario)
            ->setParameter('videoId', $video->videoId())
            ->setParameter('inicio', $this->emUtc($inicio))
            ->setParameter('fim', $this->emUtc($fim))
            ->getQuery()
            ->getResult();

        return $reproducoes;
    }

    /**
     * @param list<string> $videoIds
     *
     * @return list<ReproducaoYoutube>
     */
    public function listarDaExtensaoSemColetaNoIntervalo(Usuario $usuario, array $videoIds, DateTimeImmutable $inicio, DateTimeImmutable $fim): array
    {
        if ([] === $videoIds) {
            return [];
        }

        /** @var list<ReproducaoYoutube> $reproducoes */
        $reproducoes = $this->createQueryBuilder('e')
            ->innerJoin('e.video', 'v')
            ->addSelect('v')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.fonte = :fonte')
            ->andWhere('e.vistaPeloColetor = false')
            ->andWhere('v.videoId IN (:videoIds)')
            ->andWhere('e.tocadaEm BETWEEN :inicio AND :fim')
            ->setParameter('usuario', $usuario)
            ->setParameter('fonte', FonteReproducaoYoutube::Extensao->value)
            ->setParameter('videoIds', array_values(array_unique($videoIds)))
            ->setParameter('inicio', $this->emUtc($inicio))
            ->setParameter('fim', $this->emUtc($fim))
            ->getQuery()
            ->getResult();

        return $reproducoes;
    }

    /**
     * @return list<ReproducaoYoutube>
     */
    public function listarDaExtensaoSemFimAntesDe(Usuario $usuario, DateTimeImmutable $antes, DateTimeImmutable $desde): array
    {
        /** @var list<ReproducaoYoutube> $reproducoes */
        $reproducoes = $this->createQueryBuilder('e')
            ->innerJoin('e.video', 'v')
            ->addSelect('v')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.fonte = :fonte')
            ->andWhere('e.pulada IS NULL')
            ->andWhere('e.tocadaEm >= :desde')
            ->andWhere('e.tocadaEm < :antes')
            ->setParameter('usuario', $usuario)
            ->setParameter('fonte', FonteReproducaoYoutube::Extensao->value)
            ->setParameter('desde', $this->emUtc($desde))
            ->setParameter('antes', $this->emUtc($antes))
            ->getQuery()
            ->getResult();

        return $reproducoes;
    }

    public function buscarTocandoAgoraDaExtensao(Usuario $usuario, DateTimeImmutable $atualizadaDesde, DateTimeImmutable $pausadaDesde): ?ReproducaoYoutube
    {
        /** @var ReproducaoYoutube|null $reproducao */
        $reproducao = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.fonte = :fonte')
            ->andWhere('e.pulada IS NULL')
            ->andWhere('e.extensaoAtualizadaEm >= :desde OR (e.extensaoPausada = true AND e.extensaoAtualizadaEm >= :pausadaDesde)')
            ->setParameter('usuario', $usuario)
            ->setParameter('fonte', FonteReproducaoYoutube::Extensao->value)
            ->setParameter('desde', $atualizadaDesde)
            ->setParameter('pausadaDesde', $pausadaDesde)
            ->orderBy('e.extensaoAtualizadaEm', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        return $reproducao;
    }

    public function buscarUltimoEventoDaExtensao(Usuario $usuario): ?DateTimeImmutable
    {
        $valor = $this->createQueryBuilder('e')
            ->select('MAX(e.extensaoAtualizadaEm)')
            ->andWhere('e.usuario = :usuario')
            ->setParameter('usuario', $usuario)
            ->getQuery()
            ->getSingleScalarResult();

        return is_string($valor) ? new DateTimeImmutable($valor) : null;
    }

    public function limparCache(): void
    {
        $this->getEntityManager()->clear();
    }

    public function obterReferenciaUsuario(Usuario $usuario): Usuario
    {
        return $this->getEntityManager()->getReference(Usuario::class, $usuario->getId()) ?? $usuario;
    }

    public function buscarUltimaAntesDe(Usuario $usuario, DateTimeImmutable $momento): ?ReproducaoYoutube
    {
        /** @var ReproducaoYoutube|null $resultado */
        $resultado = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.tocadaEm < :momento')
            ->setParameter('usuario', $usuario)
            ->setParameter('momento', $this->emUtc($momento))
            ->orderBy('e.tocadaEm', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        return $resultado;
    }

    public function contarDoUsuario(Usuario $usuario): int
    {
        return (int) $this->createQueryBuilder('e')
            ->select('COUNT(e.uuid)')
            ->andWhere('e.usuario = :usuario')
            ->setParameter('usuario', $usuario)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * @return list<ReproducaoYoutube>
     */
    public function listarNoIntervalo(Usuario $usuario, DateTimeImmutable $inicio, DateTimeImmutable $fim): array
    {
        /** @var list<ReproducaoYoutube> $reproducoes */
        $reproducoes = $this->createQueryBuilder('e')
            ->innerJoin('e.video', 'v')
            ->addSelect('v')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.tocadaEm >= :inicio')
            ->andWhere('e.tocadaEm < :fim')
            ->setParameter('usuario', $usuario)
            ->setParameter('inicio', $inicio)
            ->setParameter('fim', $fim)
            ->orderBy('e.tocadaEm', 'ASC')
            ->addOrderBy('e.uuid', 'ASC')
            ->getQuery()
            ->getResult();

        return $reproducoes;
    }

    public function buscarPrimeiraAPartirDe(Usuario $usuario, DateTimeImmutable $momento): ?ReproducaoYoutube
    {
        /** @var ReproducaoYoutube|null $reproducao */
        $reproducao = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.tocadaEm >= :momento')
            ->setParameter('usuario', $usuario)
            ->setParameter('momento', $momento)
            ->orderBy('e.tocadaEm', 'ASC')
            ->addOrderBy('e.uuid', 'ASC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        return $reproducao;
    }

    /**
     * @return array{videosPorStatus: array<string, int>, videosUnicos: int, mesesComDados: int}
     */
    public function resumirDaFonteNoIntervalo(Usuario $usuario, FonteReproducaoYoutube $fonte, DateTimeImmutable $inicio, DateTimeImmutable $fim): array
    {
        $conexao = $this->getEntityManager()->getConnection();
        $parametros = [
            'usuarioId' => $usuario->getId(),
            'fonte' => $fonte->value,
            'inicio' => $inicio->format(self::FORMATO_MOMENTO_BANCO),
            'fim' => $fim->format(self::FORMATO_MOMENTO_BANCO),
        ];
        $filtro = 'r.usuario_id = :usuarioId AND r.fonte = :fonte AND r.tocada_em BETWEEN :inicio AND :fim';

        $porStatus = [];
        $linhas = $conexao->fetchAllAssociative(
            "SELECT v.status, COUNT(DISTINCT v.uuid) AS total FROM reproducao_youtube r INNER JOIN video_youtube v ON v.uuid = r.video_uuid WHERE {$filtro} GROUP BY v.status",
            $parametros,
        );
        foreach ($linhas as $linha) {
            $porStatus[(string) $linha['status']] = (int) $linha['total'];
        }

        $meses = (int) $conexao->fetchOne("SELECT COUNT(DISTINCT DATE_FORMAT(r.tocada_em, '%Y-%m')) FROM reproducao_youtube r WHERE {$filtro}", $parametros);

        return ['videosPorStatus' => $porStatus, 'videosUnicos' => array_sum($porStatus), 'mesesComDados' => $meses];
    }

    /**
     * @return array{porStatus: array<string, array{videos: int, reproducoes: int, streams: int, ms: int}>, porOrigem: array<string, int>, videosUnicos: int, mesesComDados: int}
     */
    public function resumirDaImportacao(ImportacaoYoutube $importacao, int $corteStreamMs): array
    {
        $conexao = $this->getEntityManager()->getConnection();
        $parametros = ['usuarioId' => $importacao->usuario()->getId(), 'importacao' => $importacao->uuid()->toBinary(), 'corte' => $corteStreamMs];
        $tipos = ['importacao' => ParameterType::BINARY];
        $filtro = 'r.usuario_id = :usuarioId AND r.importacao_youtube_uuid = :importacao';

        $porStatus = [];
        $linhas = $conexao->fetchAllAssociative(
            "SELECT v.status, COUNT(DISTINCT v.uuid) AS videos, COUNT(*) AS reproducoes, SUM(r.ms_reproduzidos >= :corte) AS streams, COALESCE(SUM(r.ms_reproduzidos), 0) AS ms
            FROM reproducao_youtube r INNER JOIN video_youtube v ON v.uuid = r.video_uuid WHERE {$filtro} GROUP BY v.status",
            $parametros,
            $tipos,
        );
        foreach ($linhas as $linha) {
            $porStatus[(string) $linha['status']] = ['videos' => (int) $linha['videos'], 'reproducoes' => (int) $linha['reproducoes'], 'streams' => (int) $linha['streams'], 'ms' => (int) $linha['ms']];
        }

        $porOrigem = [];
        $linhas = $conexao->fetchAllAssociative(
            "SELECT COALESCE(v.origem_classificacao, '') AS origem, COUNT(DISTINCT v.uuid) AS videos
            FROM reproducao_youtube r INNER JOIN video_youtube v ON v.uuid = r.video_uuid WHERE {$filtro} AND v.status IN ('musica', 'mashup') GROUP BY origem",
            $parametros,
            $tipos,
        );
        foreach ($linhas as $linha) {
            $porOrigem[(string) $linha['origem']] = (int) $linha['videos'];
        }

        $meses = (int) $conexao->fetchOne("SELECT COUNT(DISTINCT DATE_FORMAT(r.tocada_em, '%Y-%m')) FROM reproducao_youtube r WHERE {$filtro}", $parametros, $tipos);

        return [
            'porStatus' => $porStatus,
            'porOrigem' => $porOrigem,
            'videosUnicos' => array_sum(array_column($porStatus, 'videos')),
            'mesesComDados' => $meses,
        ];
    }

    private function emUtc(DateTimeImmutable $momento): DateTimeImmutable
    {
        return $momento->setTimezone(new DateTimeZone(self::FUSO_UTC));
    }
}
