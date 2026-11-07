<?php

declare(strict_types=1);

namespace App\Repository;

use App\DataObject\Spotify\CuriosidadesSpotifyDTO;
use App\DataObject\Spotify\ItemRankingArtistaDTO;
use App\DataObject\Spotify\ItemRankingMusicaDTO;
use App\DataObject\Spotify\MesDisponivelDTO;
use App\DataObject\Spotify\MinutosPorDiaDTO;
use App\DataObject\Spotify\PeriodoMesSpotifyDTO;
use App\DataObject\Spotify\TotaisMesDTO;
use App\Entity\ReproducaoSpotify;
use App\Entity\Usuario;
use App\Enum\FonteReproducaoSpotify;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use DateTimeImmutable;
use DateTimeZone;
use Doctrine\Persistence\ManagerRegistry;
use PDO;

/**
 * @extends ServiceEntityRepository<ReproducaoSpotify>
 */
final class ReproducaoSpotifyRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ReproducaoSpotify::class);
    }

    public function salvar(ReproducaoSpotify $reproducao, bool $flush = true): void
    {
        $this->getEntityManager()->persist($reproducao);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(ReproducaoSpotify $reproducao, bool $flush = true): void
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

    public function limparCache(): void
    {
        $this->getEntityManager()->clear();
    }

    public function obterReferenciaUsuario(Usuario $usuario): Usuario
    {
        return $this->getEntityManager()->getReference(Usuario::class, $usuario->getId()) ?? $usuario;
    }

    /**
     * @return array<int, ReproducaoSpotify>
     */
    public function buscarPorIntervaloTempo(
        Usuario $usuario,
        DateTimeImmutable $inicio,
        DateTimeImmutable $fim,
    ): array {
        /** @var array<int, ReproducaoSpotify> $resultado */
        $resultado = $this->createQueryBuilder('r')
            ->andWhere('r.usuario = :usuario')
            ->andWhere('r.tocadaEm >= :inicio')
            ->andWhere('r.tocadaEm <= :fim')
            ->setParameter('usuario', $usuario)
            ->setParameter('inicio', $inicio)
            ->setParameter('fim', $fim)
            ->orderBy('r.tocadaEm', 'ASC')
            ->getQuery()
            ->getResult();

        return $resultado;
    }

    public function buscarUltimaTocadaAntesDe(Usuario $usuario, DateTimeImmutable $momento): ?DateTimeImmutable
    {
        /** @var ReproducaoSpotify|null $anterior */
        $anterior = $this->createQueryBuilder('r')
            ->andWhere('r.usuario = :usuario')
            ->andWhere('r.tocadaEm < :momento')
            ->setParameter('usuario', $usuario)
            ->setParameter('momento', $momento)
            ->orderBy('r.tocadaEm', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        if (null === $anterior) {
            return null;
        }

        $fimEmUtc = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $anterior->tocadaEm()->format('Y-m-d H:i:s'), new DateTimeZone('UTC'));

        return false === $fimEmUtc ? $anterior->tocadaEm() : $fimEmUtc;
    }

    public function apagarPorUsuarioEFonte(Usuario $usuario, FonteReproducaoSpotify $fonte): int
    {
        /** @var int $resultado */
        $resultado = $this->createQueryBuilder('r')
            ->delete()
            ->andWhere('r.usuario = :usuario')
            ->andWhere('r.fonte = :fonte')
            ->setParameter('usuario', $usuario)
            ->setParameter('fonte', $fonte)
            ->getQuery()
            ->execute();

        return $resultado;
    }

    /**
     * @param array<int, string> $chaves
     *
     * @return array<int, string>
     */
    public function buscarChavesExistentesDoUsuario(Usuario $usuario, array $chaves): array
    {
        if (empty($chaves)) {
            return [];
        }

        /** @var array<int, array{chaveDeduplicacao: string}> $linhas */
        $linhas = $this->createQueryBuilder('r')
            ->select('r.chaveDeduplicacao')
            ->andWhere('r.usuario = :usuario')
            ->andWhere('r.chaveDeduplicacao IN (:chaves)')
            ->setParameter('usuario', $usuario)
            ->setParameter('chaves', $chaves)
            ->getQuery()
            ->getScalarResult();

        return array_column($linhas, 'chaveDeduplicacao');
    }

    /**
     * @return array<int, MesDisponivelDTO>
     */
    public function listarMesesDisponiveis(Usuario $usuario): array
    {
        $conn = $this->getEntityManager()->getConnection();

        $sql = "
            SELECT 
                YEAR(r.tocada_em) as ano,
                MONTH(r.tocada_em) as mes,
                COUNT(*) as total_reproducoes,
                ROUND(SUM(r.ms_reproduzidos) / 60000) as total_minutos
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId
            GROUP BY ano, mes
            ORDER BY ano DESC, mes DESC
        ";

        /** @var array<int, array{ano: int|string, mes: int|string, total_reproducoes: int|string, total_minutos: int|string|null}> $linhas */
        $linhas = $conn->executeQuery($sql, [
            'usuarioId' => $usuario->getId(),
        ])->fetchAllAssociative();

        $meses = [];
        foreach ($linhas as $linha) {
            $meses[] = new MesDisponivelDTO(
                ano: (int) $linha['ano'],
                mes: (int) $linha['mes'],
                totalReproducoes: (int) $linha['total_reproducoes'],
                totalMinutos: (int) ($linha['total_minutos'] ?? 0),
            );
        }

        return $meses;
    }

    public function calcularTotaisMes(
        Usuario $usuario,
        PeriodoMesSpotifyDTO $periodo,
        int $corteStreamMs = 30000,
    ): TotaisMesDTO {
        $conn = $this->getEntityManager()->getConnection();

        $sql = "
            SELECT 
                COALESCE(ROUND(SUM(r.ms_reproduzidos) / 60000), 0) as total_minutos,
                COALESCE(SUM(CASE WHEN r.ms_reproduzidos >= :corteStreamMs THEN 1 ELSE 0 END), 0) as total_streams,
                COUNT(DISTINCT CASE 
                    WHEN r.codigo_faixa IS NOT NULL AND r.codigo_faixa != '' THEN r.codigo_faixa 
                    ELSE CONCAT(LOWER(TRIM(r.nome_faixa)), '|', LOWER(TRIM(r.artista_principal))) 
                END) as faixas_distintas
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId
              AND r.tocada_em >= :inicioUtc
              AND r.tocada_em < :fimUtc
        ";

        /** @var array{total_minutos: int|string|null, total_streams: int|string|null, faixas_distintas: int|string|null} $linha */
        $linha = $conn->executeQuery($sql, [
            'usuarioId' => $usuario->getId(),
            'inicioUtc' => $periodo->inicioUtc()->format('Y-m-d H:i:s'),
            'fimUtc' => $periodo->fimUtc()->format('Y-m-d H:i:s'),
            'corteStreamMs' => $corteStreamMs,
        ])->fetchAssociative();

        return new TotaisMesDTO(
            totalMinutos: (int) ($linha['total_minutos'] ?? 0),
            totalStreams: (int) ($linha['total_streams'] ?? 0),
            faixasDistintas: (int) ($linha['faixas_distintas'] ?? 0),
        );
    }

    /**
     * @return array<int, MinutosPorDiaDTO>
     */
    public function calcularMinutosPorDia(Usuario $usuario, PeriodoMesSpotifyDTO $periodo): array
    {
        $conn = $this->getEntityManager()->getConnection();

        $sql = "
            SELECT 
                DATE(r.tocada_em) as data_local,
                DAY(r.tocada_em) as dia,
                COALESCE(ROUND(SUM(r.ms_reproduzidos) / 60000), 0) as minutos
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId
              AND r.tocada_em >= :inicioUtc
              AND r.tocada_em < :fimUtc
            GROUP BY data_local, dia
            ORDER BY data_local ASC
        ";

        /** @var array<int, array{data_local: string, dia: int|string, minutos: int|string|null}> $linhas */
        $linhas = $conn->executeQuery($sql, [
            'usuarioId' => $usuario->getId(),
            'inicioUtc' => $periodo->inicioUtc()->format('Y-m-d H:i:s'),
            'fimUtc' => $periodo->fimUtc()->format('Y-m-d H:i:s'),
        ])->fetchAllAssociative();

        /** @var array<int, int> $minutosPorDiaMap */
        $minutosPorDiaMap = [];
        foreach ($linhas as $linha) {
            $minutosPorDiaMap[(int) $linha['dia']] = (int) ($linha['minutos'] ?? 0);
        }

        $diasNoMes = (int) (new DateTimeImmutable(sprintf('%04d-%02d-01', $periodo->ano(), $periodo->mes())))->format('t');
        $resultado = [];

        for ($dia = 1; $dia <= $diasNoMes; $dia++) {
            $dataIso = sprintf('%04d-%02d-%02d', $periodo->ano(), $periodo->mes(), $dia);
            $minutos = $minutosPorDiaMap[$dia] ?? 0;
            $resultado[] = new MinutosPorDiaDTO(
                data: $dataIso,
                dia: $dia,
                minutos: $minutos,
            );
        }

        return $resultado;
    }

    /**
     * @return array<int, ItemRankingMusicaDTO>
     */
    public function obterRankingMusicasMes(
        Usuario $usuario,
        PeriodoMesSpotifyDTO $periodo,
        int $corteStreamMs = 30000,
        int $limite = 50,
    ): array {
        $conn = $this->getEntityManager()->getConnection();

        $sql = "
            SELECT 
                MAX(r.codigo_faixa) as codigo_faixa,
                r.nome_faixa,
                r.artista_principal,
                MAX(r.album) as album,
                SUM(CASE WHEN r.ms_reproduzidos >= :corteStreamMs THEN 1 ELSE 0 END) as total_streams,
                SUM(r.ms_reproduzidos) as total_ms,
                MAX(r.tocada_em) as mais_recente_em
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId
              AND r.tocada_em >= :inicioUtc
              AND r.tocada_em < :fimUtc
            GROUP BY 
                CASE 
                    WHEN r.codigo_faixa IS NOT NULL AND r.codigo_faixa != '' THEN r.codigo_faixa 
                    ELSE CONCAT(LOWER(TRIM(r.nome_faixa)), '|', LOWER(TRIM(r.artista_principal))) 
                END,
                r.nome_faixa,
                r.artista_principal
            HAVING total_streams > 0
            ORDER BY total_streams DESC, total_ms DESC, mais_recente_em DESC
            LIMIT :limite
        ";

        /** @var array<int, array{codigo_faixa: ?string, nome_faixa: string, artista_principal: string, album: ?string, total_streams: int|string, total_ms: int|string, mais_recente_em: string}> $linhas */
        $linhas = $conn->executeQuery($sql, [
            'usuarioId' => $usuario->getId(),
            'inicioUtc' => $periodo->inicioUtc()->format('Y-m-d H:i:s'),
            'fimUtc' => $periodo->fimUtc()->format('Y-m-d H:i:s'),
            'corteStreamMs' => $corteStreamMs,
            'limite' => $limite,
        ], [
            'limite' => PDO::PARAM_INT,
        ])->fetchAllAssociative();

        $itens = [];
        foreach ($linhas as $linha) {
            $itens[] = new ItemRankingMusicaDTO(
                codigoFaixa: $linha['codigo_faixa'] !== null && '' !== trim($linha['codigo_faixa']) ? trim($linha['codigo_faixa']) : null,
                nomeFaixa: $linha['nome_faixa'],
                artistaPrincipal: $linha['artista_principal'],
                album: $linha['album'] ?? 'Desconhecido',
                totalStreams: (int) $linha['total_streams'],
                totalMs: (int) $linha['total_ms'],
                maisRecenteEm: new DateTimeImmutable($linha['mais_recente_em']),
            );
        }

        return $itens;
    }

    /**
     * @return array<int, array{nomeFaixa: string, codigoFaixa: ?string, album: string, streams: int, totalMinutos: int}>
     */
    public function obterMusicasMaisOuvidasDoArtista(
        Usuario $usuario,
        string $nomeArtista,
        ?PeriodoMesSpotifyDTO $periodo = null,
        int $limite = 5,
        int $corteStreamMs = 30000,
    ): array {
        $conn = $this->getEntityManager()->getConnection();

        $wherePeriodo = '';
        $params = [
            'usuarioId' => $usuario->getId(),
            'artista' => $nomeArtista,
            'corteStreamMs' => $corteStreamMs,
            'limite' => $limite,
        ];

        if (null !== $periodo) {
            $wherePeriodo = 'AND r.tocada_em >= :inicioUtc AND r.tocada_em < :fimUtc';
            $params['inicioUtc'] = $periodo->inicioUtc()->format('Y-m-d H:i:s');
            $params['fimUtc'] = $periodo->fimUtc()->format('Y-m-d H:i:s');
        }

        $sql = "
            SELECT 
                r.nome_faixa,
                MAX(r.codigo_faixa) as codigo_faixa,
                MAX(r.album) as album,
                SUM(CASE WHEN r.ms_reproduzidos >= :corteStreamMs THEN 1 ELSE 0 END) as total_streams,
                SUM(r.ms_reproduzidos) as total_ms
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId
              AND r.artista_principal = :artista
              {$wherePeriodo}
            GROUP BY r.nome_faixa
            HAVING total_streams > 0
            ORDER BY total_streams DESC, total_ms DESC
            LIMIT :limite
        ";

        /** @var array<int, array{nome_faixa: string, codigo_faixa: ?string, album: ?string, total_streams: int|string, total_ms: int|string}> $linhas */
        $linhas = $conn->executeQuery($sql, $params, [
            'limite' => PDO::PARAM_INT,
        ])->fetchAllAssociative();

        $resultado = [];
        foreach ($linhas as $linha) {
            $ms = (int) $linha['total_ms'];
            $resultado[] = [
                'nomeFaixa' => $linha['nome_faixa'],
                'codigoFaixa' => $linha['codigo_faixa'] !== null && '' !== trim($linha['codigo_faixa']) ? trim($linha['codigo_faixa']) : null,
                'album' => $linha['album'] ?? 'Desconhecido',
                'streams' => (int) $linha['total_streams'],
                'totalMinutos' => (int) round($ms / 60000),
            ];
        }

        return $resultado;
    }

    /**
     * @return array<int, ItemRankingArtistaDTO>
     */
    public function obterRankingArtistasMes(
        Usuario $usuario,
        PeriodoMesSpotifyDTO $periodo,
        int $corteStreamMs = 30000,
        int $limite = 20,
    ): array {
        $conn = $this->getEntityManager()->getConnection();

        $sql = "
            SELECT 
                r.artista_principal,
                MAX(r.codigo_artista_principal) as codigo_artista,
                SUM(CASE WHEN r.ms_reproduzidos >= :corteStreamMs THEN 1 ELSE 0 END) as total_streams,
                SUM(r.ms_reproduzidos) as total_ms
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId
              AND r.tocada_em >= :inicioUtc
              AND r.tocada_em < :fimUtc
            GROUP BY r.artista_principal
            HAVING total_streams > 0
            ORDER BY total_streams DESC, total_ms DESC
            LIMIT :limite
        ";

        /** @var array<int, array{artista_principal: string, codigo_artista: ?string, total_streams: int|string, total_ms: int|string}> $linhas */
        $linhas = $conn->executeQuery($sql, [
            'usuarioId' => $usuario->getId(),
            'inicioUtc' => $periodo->inicioUtc()->format('Y-m-d H:i:s'),
            'fimUtc' => $periodo->fimUtc()->format('Y-m-d H:i:s'),
            'corteStreamMs' => $corteStreamMs,
            'limite' => $limite,
        ], [
            'limite' => PDO::PARAM_INT,
        ])->fetchAllAssociative();

        $itens = [];
        foreach ($linhas as $linha) {
            $itens[] = new ItemRankingArtistaDTO(
                nomeArtista: $linha['artista_principal'],
                codigoArtista: $linha['codigo_artista'] !== null && '' !== trim($linha['codigo_artista']) ? trim($linha['codigo_artista']) : null,
                totalStreams: (int) $linha['total_streams'],
                totalMs: (int) $linha['total_ms'],
            );
        }

        return $itens;
    }

    /**
     * @return array{totalMinutos: int, totalStreams: int}
     */
    public function calcularTotaisIntervalo(
        Usuario $usuario,
        DateTimeImmutable $inicioUtc,
        DateTimeImmutable $fimUtc,
        int $corteStreamMs = 30000,
    ): array {
        $conn = $this->getEntityManager()->getConnection();

        $sql = "
            SELECT 
                COALESCE(ROUND(SUM(r.ms_reproduzidos) / 60000), 0) as total_minutos,
                COALESCE(SUM(CASE WHEN r.ms_reproduzidos >= :corteStreamMs THEN 1 ELSE 0 END), 0) as total_streams
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId
              AND r.tocada_em >= :inicioUtc
              AND r.tocada_em < :fimUtc
        ";

        /** @var array{total_minutos: int|string|null, total_streams: int|string|null} $linha */
        $linha = $conn->executeQuery($sql, [
            'usuarioId' => $usuario->getId(),
            'inicioUtc' => $inicioUtc->format('Y-m-d H:i:s'),
            'fimUtc' => $fimUtc->format('Y-m-d H:i:s'),
            'corteStreamMs' => $corteStreamMs,
        ])->fetchAssociative();

        return [
            'totalMinutos' => (int) ($linha['total_minutos'] ?? 0),
            'totalStreams' => (int) ($linha['total_streams'] ?? 0),
        ];
    }

    /**
     * @return array<int, ItemRankingMusicaDTO>
     */
    public function obterRankingMusicasIntervalo(
        Usuario $usuario,
        DateTimeImmutable $inicioUtc,
        DateTimeImmutable $fimUtc,
        int $corteStreamMs = 30000,
        int $limite = 5,
    ): array {
        $conn = $this->getEntityManager()->getConnection();

        $sql = "
            SELECT 
                MAX(r.codigo_faixa) as codigo_faixa,
                r.nome_faixa,
                r.artista_principal,
                MAX(r.album) as album,
                SUM(CASE WHEN r.ms_reproduzidos >= :corteStreamMs THEN 1 ELSE 0 END) as total_streams,
                SUM(r.ms_reproduzidos) as total_ms,
                MAX(r.tocada_em) as mais_recente_em
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId
              AND r.tocada_em >= :inicioUtc
              AND r.tocada_em < :fimUtc
            GROUP BY 
                CASE 
                    WHEN r.codigo_faixa IS NOT NULL AND r.codigo_faixa != '' THEN r.codigo_faixa 
                    ELSE CONCAT(LOWER(TRIM(r.nome_faixa)), '|', LOWER(TRIM(r.artista_principal))) 
                END,
                r.nome_faixa,
                r.artista_principal
            HAVING total_streams > 0
            ORDER BY total_streams DESC, total_ms DESC, mais_recente_em DESC
            LIMIT :limite
        ";

        /** @var array<int, array{codigo_faixa: ?string, nome_faixa: string, artista_principal: string, album: ?string, total_streams: int|string, total_ms: int|string, mais_recente_em: string}> $linhas */
        $linhas = $conn->executeQuery($sql, [
            'usuarioId' => $usuario->getId(),
            'inicioUtc' => $inicioUtc->format('Y-m-d H:i:s'),
            'fimUtc' => $fimUtc->format('Y-m-d H:i:s'),
            'corteStreamMs' => $corteStreamMs,
            'limite' => $limite,
        ], [
            'limite' => PDO::PARAM_INT,
        ])->fetchAllAssociative();

        $itens = [];
        foreach ($linhas as $linha) {
            $itens[] = new ItemRankingMusicaDTO(
                codigoFaixa: $linha['codigo_faixa'] !== null && '' !== trim($linha['codigo_faixa']) ? trim($linha['codigo_faixa']) : null,
                nomeFaixa: $linha['nome_faixa'],
                artistaPrincipal: $linha['artista_principal'],
                album: $linha['album'] ?? 'Desconhecido',
                totalStreams: (int) $linha['total_streams'],
                totalMs: (int) $linha['total_ms'],
                maisRecenteEm: new DateTimeImmutable($linha['mais_recente_em']),
            );
        }

        return $itens;
    }

    /**
     * @return array<int, ItemRankingArtistaDTO>
     */
    public function obterRankingArtistasIntervalo(
        Usuario $usuario,
        DateTimeImmutable $inicioUtc,
        DateTimeImmutable $fimUtc,
        int $corteStreamMs = 30000,
        int $limite = 5,
    ): array {
        $conn = $this->getEntityManager()->getConnection();

        $sql = "
            SELECT 
                r.artista_principal,
                MAX(r.codigo_artista_principal) as codigo_artista,
                SUM(CASE WHEN r.ms_reproduzidos >= :corteStreamMs THEN 1 ELSE 0 END) as total_streams,
                SUM(r.ms_reproduzidos) as total_ms
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId
              AND r.tocada_em >= :inicioUtc
              AND r.tocada_em < :fimUtc
            GROUP BY r.artista_principal
            HAVING total_streams > 0
            ORDER BY total_streams DESC, total_ms DESC
            LIMIT :limite
        ";

        /** @var array<int, array{artista_principal: string, codigo_artista: ?string, total_streams: int|string, total_ms: int|string}> $linhas */
        $linhas = $conn->executeQuery($sql, [
            'usuarioId' => $usuario->getId(),
            'inicioUtc' => $inicioUtc->format('Y-m-d H:i:s'),
            'fimUtc' => $fimUtc->format('Y-m-d H:i:s'),
            'corteStreamMs' => $corteStreamMs,
            'limite' => $limite,
        ], [
            'limite' => PDO::PARAM_INT,
        ])->fetchAllAssociative();

        $itens = [];
        foreach ($linhas as $linha) {
            $itens[] = new ItemRankingArtistaDTO(
                nomeArtista: $linha['artista_principal'],
                codigoArtista: $linha['codigo_artista'] !== null && '' !== trim($linha['codigo_artista']) ? trim($linha['codigo_artista']) : null,
                totalStreams: (int) $linha['total_streams'],
                totalMs: (int) $linha['total_ms'],
            );
        }

        return $itens;
    }

    public function obterCuriosidadesMes(
        Usuario $usuario,
        PeriodoMesSpotifyDTO $periodo,
        ?PeriodoMesSpotifyDTO $periodoAnterior = null,
    ): CuriosidadesSpotifyDTO {
        $conn = $this->getEntityManager()->getConnection();
        $params = [
            'usuarioId' => $usuario->getId(),
            'inicioUtc' => $periodo->inicioUtc()->format('Y-m-d H:i:s'),
            'fimUtc' => $periodo->fimUtc()->format('Y-m-d H:i:s'),
        ];

        // 1. Horário de pico
        $sqlPico = "
            SELECT 
                HOUR(CONVERT_TZ(r.tocada_em, '+00:00', '-03:00')) as hora,
                ROUND(SUM(r.ms_reproduzidos) / 60000) as minutos
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId
              AND r.tocada_em >= :inicioUtc
              AND r.tocada_em < :fimUtc
            GROUP BY hora
            ORDER BY minutos DESC
            LIMIT 1
        ";
        /** @var array{hora: int|string, minutos: int|string}|false $linhaPico */
        $linhaPico = $conn->executeQuery($sqlPico, $params)->fetchAssociative();
        $horarioPico = null;
        $minutosPico = 0;
        if (false !== $linhaPico) {
            $hora = (int) $linhaPico['hora'];
            $horarioPico = sprintf('%02dh — %02dh', $hora, ($hora + 1) % 24);
            $minutosPico = (int) $linhaPico['minutos'];
        }

        // 2. Dia da semana mais ouvido
        $sqlDiaSemana = "
            SELECT 
                DAYOFWEEK(CONVERT_TZ(r.tocada_em, '+00:00', '-03:00')) as dia_semana,
                ROUND(SUM(r.ms_reproduzidos) / 60000) as minutos
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId
              AND r.tocada_em >= :inicioUtc
              AND r.tocada_em < :fimUtc
            GROUP BY dia_semana
            ORDER BY minutos DESC
            LIMIT 1
        ";
        /** @var array{dia_semana: int|string, minutos: int|string}|false $linhaDiaSemana */
        $linhaDiaSemana = $conn->executeQuery($sqlDiaSemana, $params)->fetchAssociative();
        $diaSemanaMaisOuvido = null;
        $minutosDiaSemana = 0;
        if (false !== $linhaDiaSemana) {
            $diasSemanaNomes = [
                1 => 'Domingo',
                2 => 'Segunda-feira',
                3 => 'Terça-feira',
                4 => 'Quarta-feira',
                5 => 'Quinta-feira',
                6 => 'Sexta-feira',
                7 => 'Sábado',
            ];
            $diaSemanaMaisOuvido = $diasSemanaNomes[(int) $linhaDiaSemana['dia_semana']] ?? null;
            $minutosDiaSemana = (int) $linhaDiaSemana['minutos'];
        }

        // 3. Dia mais longo
        $sqlDiaLongo = "
            SELECT 
                DATE(r.tocada_em) as data_local,
                ROUND(SUM(r.ms_reproduzidos) / 60000) as minutos
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId
              AND r.tocada_em >= :inicioUtc
              AND r.tocada_em < :fimUtc
            GROUP BY data_local
            ORDER BY minutos DESC
            LIMIT 1
        ";
        /** @var array{data_local: string, minutos: int|string}|false $linhaDiaLongo */
        $linhaDiaLongo = $conn->executeQuery($sqlDiaLongo, $params)->fetchAssociative();
        $diaLongoData = null;
        $diaLongoMinutos = 0;
        if (false !== $linhaDiaLongo) {
            $diaLongoData = $linhaDiaLongo['data_local'];
            $diaLongoMinutos = (int) $linhaDiaLongo['minutos'];
        }

        // 4. Faixa mais repetida em um único dia
        $sqlRepetida = "
            SELECT 
                r.nome_faixa,
                r.artista_principal,
                DATE(r.tocada_em) as data_local,
                COUNT(*) as vezes
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId
              AND r.tocada_em >= :inicioUtc
              AND r.tocada_em < :fimUtc
              AND r.ms_reproduzidos >= :corteStreamMs
            GROUP BY 
                data_local,
                CASE 
                    WHEN r.codigo_faixa IS NOT NULL AND r.codigo_faixa != '' THEN r.codigo_faixa 
                    ELSE CONCAT(LOWER(TRIM(r.nome_faixa)), '|', LOWER(TRIM(r.artista_principal))) 
                END,
                r.nome_faixa,
                r.artista_principal
            ORDER BY vezes DESC
            LIMIT 1
        ";
        /** @var array{nome_faixa: string, artista_principal: string, data_local: string, vezes: int|string}|false $linhaRepetida */
        $linhaRepetida = $conn->executeQuery($sqlRepetida, [
            ...$params,
            'corteStreamMs' => AnaliseReproducaoSpotifyRepository::CORTE_STREAM_MS,
        ])->fetchAssociative();
        $faixaRepetidaNome = null;
        $faixaRepetidaArtista = null;
        $faixaRepetidaVezes = 0;
        $faixaRepetidaData = null;
        if (false !== $linhaRepetida) {
            $faixaRepetidaNome = $linhaRepetida['nome_faixa'];
            $faixaRepetidaArtista = $linhaRepetida['artista_principal'];
            $faixaRepetidaVezes = (int) $linhaRepetida['vezes'];
            $faixaRepetidaData = $linhaRepetida['data_local'];
        }

        // 5. Artistas descobertos no mês
        $sqlDescobertos = "
            SELECT COUNT(DISTINCT r.artista_principal) as total
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId
              AND r.tocada_em >= :inicioUtc
              AND r.tocada_em < :fimUtc
              AND r.artista_principal NOT IN (
                  SELECT DISTINCT r2.artista_principal
                  FROM reproducao_spotify r2
                  WHERE r2.usuario_id = :usuarioId
                    AND r2.tocada_em < :inicioUtc
              )
        ";
        /** @var array{total: int|string}|false $linhaDescobertos */
        $linhaDescobertos = $conn->executeQuery($sqlDescobertos, $params)->fetchAssociative();
        $artistasDescobertos = false !== $linhaDescobertos ? (int) $linhaDescobertos['total'] : 0;

        // 6. Média diária de minutos e variação
        $sqlTotalMinutos = "
            SELECT COALESCE(ROUND(SUM(r.ms_reproduzidos) / 60000), 0) as total_minutos
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId
              AND r.tocada_em >= :inicioUtc
              AND r.tocada_em < :fimUtc
        ";
        /** @var array{total_minutos: int|string}|false $linhaTotalMinutos */
        $linhaTotalMinutos = $conn->executeQuery($sqlTotalMinutos, $params)->fetchAssociative();
        $totalMinutosMes = false !== $linhaTotalMinutos ? (int) $linhaTotalMinutos['total_minutos'] : 0;

        $agoraCalendario = PeriodoMesSpotifyDTO::agoraCalendario();
        $diasNoMes = (int) (new DateTimeImmutable(sprintf('%04d-%02d-01', $periodo->ano(), $periodo->mes())))->format('t');
        $diasDecorridos = $periodo->isMesCorrente() ? max(1, (int) $agoraCalendario->format('j')) : $diasNoMes;
        $mediaDiaria = (int) round($totalMinutosMes / $diasDecorridos);

        $variacaoMediaDiaria = null;
        if (null !== $periodoAnterior) {
            $paramsAnterior = [
                'usuarioId' => $usuario->getId(),
                'inicioUtc' => $periodoAnterior->inicioUtc()->format('Y-m-d H:i:s'),
                'fimUtc' => $periodoAnterior->fimUtc()->format('Y-m-d H:i:s'),
            ];
            /** @var array{total_minutos: int|string}|false $linhaTotalAnterior */
            $linhaTotalAnterior = $conn->executeQuery($sqlTotalMinutos, $paramsAnterior)->fetchAssociative();
            $totalMinutosAnterior = false !== $linhaTotalAnterior ? (int) $linhaTotalAnterior['total_minutos'] : 0;
            $diasMesAnterior = (int) (new DateTimeImmutable(sprintf('%04d-%02d-01', $periodoAnterior->ano(), $periodoAnterior->mes())))->format('t');
            $mediaAnterior = (int) round($totalMinutosAnterior / max(1, $diasMesAnterior));

            if ($mediaAnterior > 0) {
                $variacaoMediaDiaria = (int) round((($mediaDiaria - $mediaAnterior) / $mediaAnterior) * 100);
            }
        }

        return new CuriosidadesSpotifyDTO(
            horarioPico: $horarioPico,
            minutosHorarioPico: $minutosPico,
            diaSemanaMaisOuvido: $diaSemanaMaisOuvido,
            minutosDiaSemana: $minutosDiaSemana,
            diaMaisLongoData: $diaLongoData,
            diaMaisLongoMinutos: $diaLongoMinutos,
            faixaMaisRepetidaNome: $faixaRepetidaNome,
            faixaMaisRepetidaArtista: $faixaRepetidaArtista,
            faixaMaisRepetidaVezes: $faixaRepetidaVezes,
            faixaMaisRepetidaData: $faixaRepetidaData,
            artistasDescobertosNoMes: $artistasDescobertos,
            mediaMinutosDiarios: $mediaDiaria,
            variacaoMediaDiariaPercentual: $variacaoMediaDiaria,
        );
    }

}
