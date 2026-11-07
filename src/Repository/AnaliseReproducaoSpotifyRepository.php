<?php

declare(strict_types=1);

namespace App\Repository;

use App\DataObject\Spotify\Analise\AlbumAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\ArtistaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\MusicaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\Entity\ReproducaoSpotify;
use App\Entity\Usuario;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ReproducaoSpotify>
 */
final class AnaliseReproducaoSpotifyRepository extends ServiceEntityRepository
{
    public const int CORTE_STREAM_MS = 30000;

    private const string DATA_LOCAL = "CONVERT_TZ(r.tocada_em, '+00:00', '-03:00')";
    private const string CHAVE_FAIXA = 'LOWER(TRIM(r.nome_faixa))';
    private const string CHAVE_ARTISTA = 'LOWER(TRIM(r.artista_principal))';

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ReproducaoSpotify::class);
    }

    /**
     * @return list<MusicaAnaliseSpotifyDTO>
     */
    public function listarRankingMusicas(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, int $limite, ?string $artista = null): array
    {
        $parametros = $this->parametrosBase($usuario);
        $filtros = $this->filtroPeriodo($periodo, $parametros) . $this->filtroArtista($artista, $parametros);

        $linhas = $this->consultar(sprintf(
            'SELECT MAX(r.nome_faixa) AS nome_faixa, MAX(r.artista_principal) AS artista, MAX(r.codigo_faixa) AS codigo_faixa,
                MAX(r.album) AS album, SUM(r.ms_reproduzidos >= :corte) AS streams, SUM(r.ms_reproduzidos) AS ms
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId %s
            GROUP BY %s, %s
            HAVING streams > 0
            ORDER BY streams DESC, ms DESC
            LIMIT %d',
            $filtros,
            self::CHAVE_FAIXA,
            self::CHAVE_ARTISTA,
            $limite,
        ), $parametros);

        return array_map(MusicaAnaliseSpotifyDTO::daLinha(...), $linhas);
    }

    /**
     * @return list<ArtistaAnaliseSpotifyDTO>
     */
    public function listarRankingArtistas(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, int $limite, bool $porMinutos = false): array
    {
        $ordem = $porMinutos ? 'ms DESC, streams DESC' : 'streams DESC, ms DESC';
        $parametros = $this->parametrosBase($usuario);
        $filtros = $this->filtroPeriodo($periodo, $parametros);

        $linhas = $this->consultar(sprintf(
            'SELECT MAX(r.artista_principal) AS artista, MAX(r.codigo_artista_principal) AS codigo_artista,
                SUM(r.ms_reproduzidos >= :corte) AS streams, SUM(r.ms_reproduzidos) AS ms
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId %s
            GROUP BY %s
            HAVING streams > 0
            ORDER BY %s
            LIMIT %d',
            $filtros,
            self::CHAVE_ARTISTA,
            $ordem,
            $limite,
        ), $parametros);

        return array_map(ArtistaAnaliseSpotifyDTO::daLinha(...), $linhas);
    }

    /**
     * @return list<AlbumAnaliseSpotifyDTO>
     */
    public function listarRankingAlbuns(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, int $limite, ?string $artista = null): array
    {
        $parametros = $this->parametrosBase($usuario);
        $filtros = $this->filtroPeriodo($periodo, $parametros) . $this->filtroArtista($artista, $parametros);

        $linhas = $this->consultar(sprintf(
            "WITH faixas AS (
                SELECT LOWER(TRIM(r.album)) AS chave_album, %s AS chave_artista,
                    MAX(r.album) AS album, MAX(r.artista_principal) AS artista, MAX(r.nome_faixa) AS nome_faixa,
                    MAX(r.codigo_faixa) AS codigo_faixa, SUM(r.ms_reproduzidos >= :corte) AS streams, SUM(r.ms_reproduzidos) AS ms
                FROM reproducao_spotify r
                WHERE r.usuario_id = :usuarioId
                    AND r.album <> '' AND r.album <> 'Desconhecido' %s
                GROUP BY chave_album, chave_artista, %s
                HAVING streams > 0
            ), ranqueadas AS (
                SELECT f.*,
                    ROW_NUMBER() OVER (PARTITION BY chave_album, chave_artista ORDER BY streams DESC, ms DESC) AS ordem,
                    SUM(streams) OVER (PARTITION BY chave_album, chave_artista) AS total_streams,
                    SUM(ms) OVER (PARTITION BY chave_album, chave_artista) AS total_ms,
                    COUNT(*) OVER (PARTITION BY chave_album, chave_artista) AS faixas_distintas
                FROM faixas f
            )
            SELECT album, artista, nome_faixa, codigo_faixa, total_streams, total_ms, faixas_distintas
            FROM ranqueadas
            WHERE ordem = 1
            ORDER BY total_streams DESC, total_ms DESC
            LIMIT %d",
            self::CHAVE_ARTISTA,
            $filtros,
            self::CHAVE_FAIXA,
            $limite,
        ), $parametros);

        return array_map(AlbumAnaliseSpotifyDTO::daLinha(...), $linhas);
    }

    /**
     * @return array{minutos: int, streams: int, reproducoes: int, artistas: int, faixas: int, dias: int, primeira: ?string, ultima: ?string}
     */
    public function calcularTotais(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        $parametros = $this->parametrosBase($usuario);
        $filtros = $this->filtroPeriodo($periodo, $parametros);

        $linha = $this->consultarLinha(sprintf(
            "SELECT COALESCE(SUM(r.ms_reproduzidos), 0) AS ms,
                COALESCE(SUM(r.ms_reproduzidos >= :corte), 0) AS streams,
                COUNT(*) AS reproducoes,
                COUNT(DISTINCT %s) AS artistas,
                COUNT(DISTINCT CONCAT(%s, '|', %s)) AS faixas,
                COUNT(DISTINCT DATE(%s)) AS dias,
                MIN(r.tocada_em) AS primeira,
                MAX(r.tocada_em) AS ultima
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId %s",
            self::CHAVE_ARTISTA,
            self::CHAVE_FAIXA,
            self::CHAVE_ARTISTA,
            $periodo->expressaoData(),
            $filtros,
        ), $parametros);

        return [
            'minutos' => (int) round(((int) ($linha['ms'] ?? 0)) / 60000),
            'streams' => (int) ($linha['streams'] ?? 0),
            'reproducoes' => (int) ($linha['reproducoes'] ?? 0),
            'artistas' => (int) ($linha['artistas'] ?? 0),
            'faixas' => (int) ($linha['faixas'] ?? 0),
            'dias' => (int) ($linha['dias'] ?? 0),
            'primeira' => is_string($linha['primeira'] ?? null) ? $linha['primeira'] : null,
            'ultima' => is_string($linha['ultima'] ?? null) ? $linha['ultima'] : null,
        ];
    }

    /**
     * @return list<array{diaSemana: int, hora: int, minutos: int, streams: int}>
     */
    public function calcularMapaHorarios(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        $parametros = $this->parametrosBase($usuario);
        $filtros = $this->filtroPeriodo($periodo, $parametros);

        $linhas = $this->consultar(sprintf(
            'SELECT DAYOFWEEK(%1$s) - 1 AS dia_semana, HOUR(%1$s) AS hora,
                SUM(r.ms_reproduzidos) AS ms, SUM(r.ms_reproduzidos >= :corte) AS streams
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId %2$s
            GROUP BY dia_semana, hora',
            self::DATA_LOCAL,
            $filtros,
        ), $parametros);

        return array_map(static fn (array $linha): array => [
            'diaSemana' => (int) $linha['dia_semana'],
            'hora' => (int) $linha['hora'],
            'minutos' => (int) round(((int) $linha['ms']) / 60000),
            'streams' => (int) $linha['streams'],
        ], $linhas);
    }

    public function calcularMinutosTopArtistas(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, int $quantidade): int
    {
        $parametros = $this->parametrosBase($usuario);
        $filtros = $this->filtroPeriodo($periodo, $parametros);

        $linha = $this->consultarLinha(sprintf(
            'SELECT COALESCE(SUM(ms), 0) AS ms FROM (
                SELECT SUM(r.ms_reproduzidos) AS ms
                FROM reproducao_spotify r
                WHERE r.usuario_id = :usuarioId %s
                GROUP BY %s
                ORDER BY ms DESC
                LIMIT %d
            ) topo',
            $filtros,
            self::CHAVE_ARTISTA,
            $quantidade,
        ), $parametros);

        return (int) round(((int) ($linha['ms'] ?? 0)) / 60000);
    }

    /**
     * @return array{faixasComStream: int, faixasUmaVez: int}
     */
    public function contarFaixasPorRepeticao(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        $parametros = $this->parametrosBase($usuario);
        $filtros = $this->filtroPeriodo($periodo, $parametros);

        $linha = $this->consultarLinha(sprintf(
            'SELECT COUNT(*) AS faixas, COALESCE(SUM(vezes = 1), 0) AS uma_vez FROM (
                SELECT COUNT(*) AS vezes
                FROM reproducao_spotify r
                WHERE r.usuario_id = :usuarioId AND r.ms_reproduzidos >= :corte %s
                GROUP BY %s, %s
            ) faixas',
            $filtros,
            self::CHAVE_FAIXA,
            self::CHAVE_ARTISTA,
        ), $parametros);

        return [
            'faixasComStream' => (int) ($linha['faixas'] ?? 0),
            'faixasUmaVez' => (int) ($linha['uma_vez'] ?? 0),
        ];
    }

    /**
     * @return array{comDadoPulo: int, puladas: int, comDadoAleatorio: int, aleatorias: int}
     */
    public function calcularComportamento(
        Usuario $usuario,
        PeriodoAnaliseSpotifyDTO $periodo,
        ?string $artista = null,
        ?string $nomeFaixa = null,
    ): array {
        $parametros = $this->parametrosBase($usuario);
        $filtros = $this->filtroPeriodo($periodo, $parametros)
            . $this->filtroArtista($artista, $parametros)
            . $this->filtroFaixa($nomeFaixa, $parametros);

        $linha = $this->consultarLinha(sprintf(
            'SELECT COALESCE(SUM(r.pulada IS NOT NULL), 0) AS com_pulo, COALESCE(SUM(r.pulada = 1), 0) AS puladas,
                COALESCE(SUM(r.aleatorio IS NOT NULL), 0) AS com_aleatorio, COALESCE(SUM(r.aleatorio = 1), 0) AS aleatorias
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId %s',
            $filtros,
        ), $parametros);

        return [
            'comDadoPulo' => (int) ($linha['com_pulo'] ?? 0),
            'puladas' => (int) ($linha['puladas'] ?? 0),
            'comDadoAleatorio' => (int) ($linha['com_aleatorio'] ?? 0),
            'aleatorias' => (int) ($linha['aleatorias'] ?? 0),
        ];
    }

    /**
     * @return list<string>
     */
    public function listarDiasOuvidos(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        $parametros = $this->parametrosBase($usuario);
        $filtros = $this->filtroPeriodo($periodo, $parametros);

        $linhas = $this->consultar(sprintf(
            'SELECT DISTINCT DATE(%s) AS dia
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId AND r.ms_reproduzidos >= :corte %s
            ORDER BY dia ASC',
            $periodo->expressaoData(),
            $filtros,
        ), $parametros);

        return array_map(static fn (array $linha): string => (string) $linha['dia'], $linhas);
    }

    /**
     * @return array{data: string, minutos: int}|null
     */
    public function buscarDiaRecorde(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo): ?array
    {
        $parametros = $this->parametrosBase($usuario);
        $filtros = $this->filtroPeriodo($periodo, $parametros);

        $linha = $this->consultarLinha(sprintf(
            'SELECT DATE(%s) AS dia, SUM(r.ms_reproduzidos) AS ms
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId %s
            GROUP BY dia
            ORDER BY ms DESC
            LIMIT 1',
            $periodo->expressaoData(),
            $filtros,
        ), $parametros);

        if (null === $linha) {
            return null;
        }

        return ['data' => (string) $linha['dia'], 'minutos' => (int) round(((int) $linha['ms']) / 60000)];
    }

    /**
     * @return array{musica: MusicaAnaliseSpotifyDTO, vezes: int, data: string}|null
     */
    public function buscarMaiorRepeticaoDiaria(
        Usuario $usuario,
        PeriodoAnaliseSpotifyDTO $periodo,
        ?string $artista = null,
        ?string $nomeFaixa = null,
    ): ?array {
        $parametros = $this->parametrosBase($usuario);
        $filtros = $this->filtroPeriodo($periodo, $parametros)
            . $this->filtroArtista($artista, $parametros)
            . $this->filtroFaixa($nomeFaixa, $parametros);

        $linha = $this->consultarLinha(sprintf(
            'SELECT DATE(%s) AS dia, MAX(r.nome_faixa) AS nome_faixa, MAX(r.artista_principal) AS artista,
                MAX(r.codigo_faixa) AS codigo_faixa, MAX(r.album) AS album, COUNT(*) AS streams, SUM(r.ms_reproduzidos) AS ms
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId AND r.ms_reproduzidos >= :corte %s
            GROUP BY dia, %s, %s
            ORDER BY streams DESC, dia DESC
            LIMIT 1',
            $periodo->expressaoData(),
            $filtros,
            self::CHAVE_FAIXA,
            self::CHAVE_ARTISTA,
        ), $parametros);

        if (null === $linha) {
            return null;
        }

        return [
            'musica' => MusicaAnaliseSpotifyDTO::daLinha($linha),
            'vezes' => (int) $linha['streams'],
            'data' => (string) $linha['dia'],
        ];
    }

    /**
     * @return list<array{ano: int, mes: int, streams: int, minutos: int}>
     */
    public function calcularEvolucaoMensal(
        Usuario $usuario,
        PeriodoAnaliseSpotifyDTO $periodo,
        ?string $artista = null,
        ?string $nomeFaixa = null,
    ): array {
        $parametros = $this->parametrosBase($usuario);
        $filtros = $this->filtroPeriodo($periodo, $parametros)
            . $this->filtroArtista($artista, $parametros)
            . $this->filtroFaixa($nomeFaixa, $parametros);

        $linhas = $this->consultar(sprintf(
            'SELECT YEAR(%1$s) AS ano, MONTH(%1$s) AS mes, SUM(r.ms_reproduzidos >= :corte) AS streams, SUM(r.ms_reproduzidos) AS ms
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId %2$s
            GROUP BY ano, mes
            ORDER BY ano ASC, mes ASC',
            $periodo->expressaoData(),
            $filtros,
        ), $parametros);

        return array_map(static fn (array $linha): array => [
            'ano' => (int) $linha['ano'],
            'mes' => (int) $linha['mes'],
            'streams' => (int) $linha['streams'],
            'minutos' => (int) round(((int) $linha['ms']) / 60000),
        ], $linhas);
    }

    /**
     * @return list<array{ano: int, mes: int, posicao: int}>
     */
    public function listarMesesNoTopo(Usuario $usuario, string $artista, ?string $nomeFaixa, int $tamanhoTopo): array
    {
        $parametros = $this->parametrosBase($usuario);
        $parametros['artista'] = $artista;
        $chave = sprintf('%s', self::CHAVE_ARTISTA);
        $alvo = 'LOWER(TRIM(:artista))';

        if (null !== $nomeFaixa) {
            $parametros['faixa'] = $nomeFaixa;
            $chave = sprintf("CONCAT(%s, '|', %s)", self::CHAVE_FAIXA, self::CHAVE_ARTISTA);
            $alvo = "CONCAT(LOWER(TRIM(:faixa)), '|', LOWER(TRIM(:artista)))";
        }

        $linhas = $this->consultar(sprintf(
            'WITH mensal AS (
                SELECT YEAR(%1$s) AS ano, MONTH(%1$s) AS mes, %2$s AS chave, SUM(r.ms_reproduzidos >= :corte) AS streams, SUM(r.ms_reproduzidos) AS ms
                FROM reproducao_spotify r
                WHERE r.usuario_id = :usuarioId
                GROUP BY ano, mes, chave
                HAVING streams > 0
            ), ranqueado AS (
                SELECT m.*, ROW_NUMBER() OVER (PARTITION BY ano, mes ORDER BY streams DESC, ms DESC) AS posicao
                FROM mensal m
            )
            SELECT ano, mes, posicao FROM ranqueado
            WHERE chave = %3$s AND posicao <= %4$d
            ORDER BY ano ASC, mes ASC',
            PeriodoAnaliseSpotifyDTO::expressaoDataCalendario(),
            $chave,
            $alvo,
            $tamanhoTopo,
        ), $parametros);

        return array_map(static fn (array $linha): array => [
            'ano' => (int) $linha['ano'],
            'mes' => (int) $linha['mes'],
            'posicao' => (int) $linha['posicao'],
        ], $linhas);
    }

    public function buscarPosicaoGeral(Usuario $usuario, string $artista, ?string $nomeFaixa): ?int
    {
        $parametros = $this->parametrosBase($usuario);
        $parametros['artista'] = $artista;
        $agrupamento = self::CHAVE_ARTISTA;
        $alvo = 'LOWER(TRIM(:artista))';

        if (null !== $nomeFaixa) {
            $parametros['faixa'] = $nomeFaixa;
            $agrupamento = sprintf("CONCAT(%s, '|', %s)", self::CHAVE_FAIXA, self::CHAVE_ARTISTA);
            $alvo = "CONCAT(LOWER(TRIM(:faixa)), '|', LOWER(TRIM(:artista)))";
        }

        $linha = $this->consultarLinha(sprintf(
            'WITH totais AS (
                SELECT %1$s AS chave, SUM(r.ms_reproduzidos >= :corte) AS streams, SUM(r.ms_reproduzidos) AS ms
                FROM reproducao_spotify r
                WHERE r.usuario_id = :usuarioId
                GROUP BY chave
                HAVING streams > 0
            ), ranqueado AS (
                SELECT chave, ROW_NUMBER() OVER (ORDER BY streams DESC, ms DESC) AS posicao FROM totais
            )
            SELECT posicao FROM ranqueado WHERE chave = %2$s',
            $agrupamento,
            $alvo,
        ), $parametros);

        return null === $linha ? null : (int) $linha['posicao'];
    }

    /**
     * @return array{artista: string, codigo_artista: ?string, nome_faixa: ?string, codigo_faixa: ?string, album: ?string, streams: int, ms: int, reproducoes: int, faixas: int, albuns: int, dias: int, primeira: string, ultima: string, duracao_ms: ?int}|null
     */
    public function buscarResumoAlvo(Usuario $usuario, string $artista, ?string $nomeFaixa): ?array
    {
        $parametros = $this->parametrosBase($usuario);
        $filtros = $this->filtroArtista($artista, $parametros) . $this->filtroFaixa($nomeFaixa, $parametros);

        $linha = $this->consultarLinha(sprintf(
            "SELECT MAX(r.artista_principal) AS artista, MAX(r.codigo_artista_principal) AS codigo_artista,
                MAX(r.nome_faixa) AS nome_faixa, MAX(r.codigo_faixa) AS codigo_faixa, MAX(r.album) AS album,
                COALESCE(SUM(r.ms_reproduzidos >= :corte), 0) AS streams, COALESCE(SUM(r.ms_reproduzidos), 0) AS ms,
                COUNT(*) AS reproducoes, COUNT(DISTINCT %s) AS faixas, COUNT(DISTINCT LOWER(TRIM(r.album))) AS albuns,
                COUNT(DISTINCT DATE(%s)) AS dias, MIN(r.tocada_em) AS primeira, MAX(r.tocada_em) AS ultima,
                MAX(r.duracao_ms) AS duracao_ms
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId %s",
            self::CHAVE_FAIXA,
            PeriodoAnaliseSpotifyDTO::expressaoDataCalendario(),
            $filtros,
        ), $parametros);

        if (null === $linha || 0 === (int) $linha['reproducoes']) {
            return null;
        }

        return [
            'artista' => (string) $linha['artista'],
            'codigo_artista' => is_string($linha['codigo_artista']) ? $linha['codigo_artista'] : null,
            'nome_faixa' => is_string($linha['nome_faixa']) ? $linha['nome_faixa'] : null,
            'codigo_faixa' => is_string($linha['codigo_faixa']) ? $linha['codigo_faixa'] : null,
            'album' => is_string($linha['album']) ? $linha['album'] : null,
            'streams' => (int) $linha['streams'],
            'ms' => (int) $linha['ms'],
            'reproducoes' => (int) $linha['reproducoes'],
            'faixas' => (int) $linha['faixas'],
            'albuns' => (int) $linha['albuns'],
            'dias' => (int) $linha['dias'],
            'primeira' => (string) $linha['primeira'],
            'ultima' => (string) $linha['ultima'],
            'duracao_ms' => null === $linha['duracao_ms'] ? null : (int) $linha['duracao_ms'],
        ];
    }

    /**
     * @return list<array{artista: ArtistaAnaliseSpotifyDTO, primeira: string}>
     */
    public function listarArtistasNovos(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        if ($periodo->isTodos()) {
            return [];
        }

        $parametros = $this->parametrosPeriodo($usuario, $periodo);

        $linhas = $this->consultar(sprintf(
            'SELECT MAX(r.artista_principal) AS artista, MAX(r.codigo_artista_principal) AS codigo_artista,
                MIN(r.tocada_em) AS primeira,
                SUM(r.tocada_em >= :inicioUtc AND r.ms_reproduzidos >= :corte) AS streams,
                SUM(CASE WHEN r.tocada_em >= :inicioUtc THEN r.ms_reproduzidos ELSE 0 END) AS ms
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId AND r.tocada_em < :fimUtc
            GROUP BY %s
            HAVING primeira >= :inicioUtc
            ORDER BY streams DESC, ms DESC',
            self::CHAVE_ARTISTA,
        ), $parametros);

        return array_map(static fn (array $linha): array => [
            'artista' => ArtistaAnaliseSpotifyDTO::daLinha($linha),
            'primeira' => (string) $linha['primeira'],
        ], $linhas);
    }

    /**
     * @return list<array{musica: MusicaAnaliseSpotifyDTO, primeira: string}>
     */
    public function listarMusicasNovas(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        if ($periodo->isTodos()) {
            return [];
        }

        $parametros = $this->parametrosPeriodo($usuario, $periodo);

        $linhas = $this->consultar(sprintf(
            'SELECT MAX(r.nome_faixa) AS nome_faixa, MAX(r.artista_principal) AS artista, MAX(r.codigo_faixa) AS codigo_faixa,
                MAX(r.album) AS album, MIN(r.tocada_em) AS primeira,
                SUM(r.tocada_em >= :inicioUtc AND r.ms_reproduzidos >= :corte) AS streams,
                SUM(CASE WHEN r.tocada_em >= :inicioUtc THEN r.ms_reproduzidos ELSE 0 END) AS ms
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId AND r.tocada_em < :fimUtc
            GROUP BY %s, %s
            HAVING primeira >= :inicioUtc AND streams > 0
            ORDER BY streams DESC, ms DESC',
            self::CHAVE_FAIXA,
            self::CHAVE_ARTISTA,
        ), $parametros);

        return array_map(static fn (array $linha): array => [
            'musica' => MusicaAnaliseSpotifyDTO::daLinha($linha),
            'primeira' => (string) $linha['primeira'],
        ], $linhas);
    }

    /**
     * @return list<array{artista: ArtistaAnaliseSpotifyDTO, ultimaAntes: string, voltouEm: string}>
     */
    public function listarRedescobertas(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, int $diasAusencia, int $limite): array
    {
        if ($periodo->isTodos()) {
            return [];
        }

        $parametros = $this->parametrosPeriodo($usuario, $periodo);

        $linhas = $this->consultar(sprintf(
            'SELECT p.artista, p.codigo_artista, p.streams, p.ms, a.ultima_antes, p.voltou_em
            FROM (
                SELECT %1$s AS chave, MAX(r.artista_principal) AS artista, MAX(r.codigo_artista_principal) AS codigo_artista,
                    COUNT(*) AS streams, SUM(r.ms_reproduzidos) AS ms, MIN(r.tocada_em) AS voltou_em
                FROM reproducao_spotify r
                WHERE r.usuario_id = :usuarioId AND r.ms_reproduzidos >= :corte
                    AND r.tocada_em >= :inicioUtc AND r.tocada_em < :fimUtc
                GROUP BY chave
            ) p
            JOIN (
                SELECT %1$s AS chave, MAX(r.tocada_em) AS ultima_antes
                FROM reproducao_spotify r
                WHERE r.usuario_id = :usuarioId AND r.tocada_em < :inicioUtc
                GROUP BY chave
            ) a ON a.chave = p.chave
            WHERE a.ultima_antes < DATE_SUB(p.voltou_em, INTERVAL %2$d DAY)
            ORDER BY p.streams DESC, p.ms DESC
            LIMIT %3$d',
            self::CHAVE_ARTISTA,
            $diasAusencia,
            $limite,
        ), $parametros);

        return array_map(static fn (array $linha): array => [
            'artista' => ArtistaAnaliseSpotifyDTO::daLinha($linha),
            'ultimaAntes' => (string) $linha['ultima_antes'],
            'voltouEm' => (string) $linha['voltou_em'],
        ], $linhas);
    }

    /**
     * @return list<array{musica: MusicaAnaliseSpotifyDTO, vezesNaJanela: int, fimJanela: string, total: int}>
     */
    public function listarObsessoes(
        Usuario $usuario,
        PeriodoAnaliseSpotifyDTO $periodo,
        int $diasJanela,
        int $minimoNaJanela,
        int $limite,
    ): array {
        $parametros = $this->parametrosBase($usuario);
        $filtros = $this->filtroPeriodo($periodo, $parametros);

        $linhas = $this->consultar(sprintf(
            'WITH base AS (
                SELECT %1$s AS chave_faixa, %2$s AS chave_artista, r.nome_faixa, r.artista_principal, r.codigo_faixa,
                    r.album, r.tocada_em, r.ms_reproduzidos,
                    COUNT(*) OVER (
                        PARTITION BY %1$s, %2$s
                        ORDER BY r.tocada_em
                        RANGE BETWEEN INTERVAL %3$d DAY PRECEDING AND CURRENT ROW
                    ) AS janela
                FROM reproducao_spotify r
                WHERE r.usuario_id = :usuarioId AND r.ms_reproduzidos >= :corte %4$s
            ), picos AS (
                SELECT b.*,
                    ROW_NUMBER() OVER (PARTITION BY chave_faixa, chave_artista ORDER BY janela DESC, tocada_em ASC) AS ordem,
                    COUNT(*) OVER (PARTITION BY chave_faixa, chave_artista) AS total,
                    SUM(ms_reproduzidos) OVER (PARTITION BY chave_faixa, chave_artista) AS ms
                FROM base b
            )
            SELECT nome_faixa, artista_principal AS artista, codigo_faixa, album, tocada_em AS fim_janela,
                janela, total AS streams, ms
            FROM picos
            WHERE ordem = 1 AND janela >= %5$d
            ORDER BY janela DESC, total DESC
            LIMIT %6$d',
            self::CHAVE_FAIXA,
            self::CHAVE_ARTISTA,
            $diasJanela,
            $filtros,
            $minimoNaJanela,
            $limite,
        ), $parametros);

        return array_map(static fn (array $linha): array => [
            'musica' => MusicaAnaliseSpotifyDTO::daLinha($linha),
            'vezesNaJanela' => (int) $linha['janela'],
            'fimJanela' => (string) $linha['fim_janela'],
            'total' => (int) $linha['streams'],
        ], $linhas);
    }

    public function buscarPrimeiraMusica(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo): ?MusicaAnaliseSpotifyDTO
    {
        $parametros = $this->parametrosBase($usuario);
        $filtros = $this->filtroPeriodo($periodo, $parametros);

        $linha = $this->consultarLinha(sprintf(
            'SELECT r.nome_faixa, r.artista_principal AS artista, r.codigo_faixa, r.album, 1 AS streams, r.ms_reproduzidos AS ms
            FROM reproducao_spotify r
            WHERE r.usuario_id = :usuarioId AND r.ms_reproduzidos >= :corte %s
            ORDER BY r.tocada_em ASC
            LIMIT 1',
            $filtros,
        ), $parametros);

        return null === $linha ? null : MusicaAnaliseSpotifyDTO::daLinha($linha);
    }

    /**
     * @return array<string, mixed>
     */
    private function parametrosBase(Usuario $usuario): array
    {
        return ['usuarioId' => $usuario->getId(), 'corte' => self::CORTE_STREAM_MS];
    }

    /**
     * @return array<string, mixed>
     */
    private function parametrosPeriodo(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        $parametros = $this->parametrosBase($usuario);
        $parametros['inicioUtc'] = $periodo->inicioUtcSql();
        $parametros['fimUtc'] = $periodo->fimUtcSql();

        return $parametros;
    }

    /**
     * @param array<string, mixed> $parametros
     */
    private function filtroPeriodo(PeriodoAnaliseSpotifyDTO $periodo, array &$parametros): string
    {
        if ($periodo->isTodos()) {
            return '';
        }

        $parametros['inicioUtc'] = $periodo->inicioUtcSql();
        $parametros['fimUtc'] = $periodo->fimUtcSql();

        return ' AND r.tocada_em >= :inicioUtc AND r.tocada_em < :fimUtc';
    }

    /**
     * @param array<string, mixed> $parametros
     */
    private function filtroArtista(?string $artista, array &$parametros): string
    {
        if (null === $artista) {
            return '';
        }

        $parametros['artistaFiltro'] = $artista;

        return sprintf(' AND %s = LOWER(TRIM(:artistaFiltro))', self::CHAVE_ARTISTA);
    }

    /**
     * @param array<string, mixed> $parametros
     */
    private function filtroFaixa(?string $nomeFaixa, array &$parametros): string
    {
        if (null === $nomeFaixa) {
            return '';
        }

        $parametros['faixaFiltro'] = $nomeFaixa;

        return sprintf(' AND %s = LOWER(TRIM(:faixaFiltro))', self::CHAVE_FAIXA);
    }

    /**
     * @param array<string, mixed> $parametros
     *
     * @return list<array<string, mixed>>
     */
    private function consultar(string $sql, array $parametros): array
    {
        /** @var list<array<string, mixed>> $linhas */
        $linhas = $this->getEntityManager()->getConnection()
            ->executeQuery($sql, $this->filtrarParametrosUsados($sql, $parametros))
            ->fetchAllAssociative();

        return $linhas;
    }

    /**
     * @param array<string, mixed> $parametros
     *
     * @return array<string, mixed>|null
     */
    private function consultarLinha(string $sql, array $parametros): ?array
    {
        $linha = $this->getEntityManager()->getConnection()
            ->executeQuery($sql, $this->filtrarParametrosUsados($sql, $parametros))
            ->fetchAssociative();

        return false === $linha ? null : $linha;
    }

    /**
     * @param array<string, mixed> $parametros
     *
     * @return array<string, mixed>
     */
    private function filtrarParametrosUsados(string $sql, array $parametros): array
    {
        return array_filter(
            $parametros,
            static fn (string $nome): bool => 1 === preg_match(sprintf('/:%s\\b/', preg_quote($nome, '/')), $sql),
            ARRAY_FILTER_USE_KEY,
        );
    }
}
