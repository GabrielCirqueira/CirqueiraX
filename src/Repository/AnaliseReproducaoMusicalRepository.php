<?php

declare(strict_types=1);

namespace App\Repository;

use App\DataObject\Musica\AlvoAnaliseMusicaDTO;
use App\DataObject\Spotify\Analise\AlbumAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\ArtistaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\MusicaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\DataObject\Spotify\MesDisponivelDTO;
use App\DataObject\Spotify\MinutosPorDiaDTO;
use App\DataObject\Spotify\PeriodoMesSpotifyDTO;
use App\Entity\ReproducaoMusical;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Enum\FonteReproducaoMusical;
use App\Enum\TipoMusicaCatalogo;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\ArrayParameterType;
use Doctrine\DBAL\ParameterType;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<ReproducaoMusical>
 */
final class AnaliseReproducaoMusicalRepository extends ServiceEntityRepository
{
    public const int CORTE_STREAM_MS = 30000;
    private const int MS_POR_MINUTO = 60000;
    private const array FAIXAS_SESSAO_MINUTOS = [15, 30, 60, 120, 240];
    private const int LIMITE_CAPAS_MARATONA = 9;
    private const string URL_FAIXA_SPOTIFY = 'https://open.spotify.com/track/%s';
    private const string URL_YOUTUBE_MUSIC = 'https://music.youtube.com/watch?v=%s';
    private const string DATA_LOCAL = "CONVERT_TZ(r.tocada_em, '+00:00', '-03:00')";
    private const string ORDEM = 'streams DESC, ms DESC';
    private const string ARTISTA_DESCONHECIDO = 'Desconhecido';
    private const string COLUNAS_POR_FONTE_SOMADAS = 'SUM(m.qtd_spotify) AS qtd_spotify, SUM(m.qtd_youtube_music) AS qtd_youtube_music,
            SUM(m.streams_spotify) AS streams_spotify, SUM(m.ms_spotify) AS ms_spotify,
            SUM(m.streams_youtube_music) AS streams_youtube_music, SUM(m.ms_youtube_music) AS ms_youtube_music,
            SUM(m.ms_estimado) AS ms_estimado';
    private const string SELECT_CREDITOS = 'SELECT mac.musica_uuid, COALESCE(ac.unido_a_uuid, ac.uuid) AS artista_uuid
            FROM musica_artista_catalogo mac INNER JOIN artista_catalogo ac ON ac.uuid = mac.artista_uuid
            UNION
            SELECT cm.mashup_uuid, COALESCE(ac.unido_a_uuid, ac.uuid)
            FROM componente_mashup cm
            INNER JOIN musica_artista_catalogo mac ON mac.musica_uuid = cm.musica_componente_uuid
            INNER JOIN artista_catalogo ac ON ac.uuid = mac.artista_uuid';
    private const string CTE_CREDITOS = 'WITH creditos (musica_uuid, artista_uuid) AS ('.self::SELECT_CREDITOS.')';
    private const string COLUNAS_POR_FONTE = "SUM(r.fonte = 'spotify') AS qtd_spotify,
            SUM(r.fonte = 'youtube_music') AS qtd_youtube_music,
            SUM(CASE WHEN r.fonte = 'spotify' AND r.ms_reproduzidos >= :corte THEN 1 ELSE 0 END) AS streams_spotify,
            COALESCE(SUM(CASE WHEN r.fonte = 'spotify' THEN r.ms_reproduzidos END), 0) AS ms_spotify,
            SUM(CASE WHEN r.fonte = 'youtube_music' AND r.ms_reproduzidos >= :corte THEN 1 ELSE 0 END) AS streams_youtube_music,
            COALESCE(SUM(CASE WHEN r.fonte = 'youtube_music' THEN r.ms_reproduzidos END), 0) AS ms_youtube_music,
            COALESCE(SUM(CASE WHEN r.tempo_exato = 0 THEN r.ms_reproduzidos END), 0) AS ms_estimado";
    private const string COLUNAS_DATAS_POR_FONTE = "MIN(CASE WHEN r.fonte = 'spotify' THEN r.tocada_em END) AS primeira_spotify,
            MAX(CASE WHEN r.fonte = 'spotify' THEN r.tocada_em END) AS ultima_spotify,
            MIN(CASE WHEN r.fonte = 'youtube_music' THEN r.tocada_em END) AS primeira_youtube_music,
            MAX(CASE WHEN r.fonte = 'youtube_music' THEN r.tocada_em END) AS ultima_youtube_music";
    private const array DIAS_SEMANA = [
        1 => 'Domingo',
        2 => 'Segunda-feira',
        3 => 'Terça-feira',
        4 => 'Quarta-feira',
        5 => 'Quinta-feira',
        6 => 'Sexta-feira',
        7 => 'Sábado',
    ];

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ReproducaoMusical::class);
    }

    /**
     * @return list<MusicaAnaliseSpotifyDTO>
     */
    public function listarRankingMusicas(
        Usuario $usuario,
        PeriodoAnaliseSpotifyDTO $periodo,
        FiltroFonteMusica $filtro,
        int $limite,
        ?AlvoAnaliseMusicaDTO $alvo = null,
        ?string $album = null,
        bool $apenasMashups = false,
    ): array {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro, $alvo);
        if ($apenasMashups) {
            $parametros['tipoMashup'] = TipoMusicaCatalogo::Mashup->value;
            $filtros .= ' AND r.musica_uuid IN (SELECT mc.uuid FROM musica_catalogo mc WHERE mc.tipo = :tipoMashup)';
        }
        if (null !== $album) {
            $parametros['albumFiltro'] = $album;
            $filtros .= ' AND r.musica_uuid IN (SELECT mc.uuid FROM musica_catalogo mc WHERE LOWER(TRIM(mc.album)) = LOWER(TRIM(:albumFiltro)))';
        }

        $linhas = $this->consultar(sprintf(
            'SELECT r.musica_uuid, SUM(r.ms_reproduzidos >= :corte) AS streams, SUM(r.ms_reproduzidos) AS ms, MAX(r.tocada_em) AS mais_recente, %s
            FROM reproducao_musical r
            WHERE r.usuario_id = :usuarioId%s
            GROUP BY r.musica_uuid
            HAVING streams > 0
            ORDER BY streams DESC, ms DESC, mais_recente DESC
            LIMIT %d',
            self::COLUNAS_POR_FONTE,
            $filtros,
            $limite,
        ), $parametros, $tipos);

        return array_map(MusicaAnaliseSpotifyDTO::daLinha(...), $this->complementarMusicas($usuario, $linhas));
    }

    /**
     * @return list<ArtistaAnaliseSpotifyDTO>
     */
    public function listarRankingArtistas(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro, int $limite): array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro);

        $linhas = $this->consultar(sprintf(
            '%s
            , por_musica AS (
                SELECT r.musica_uuid, SUM(r.ms_reproduzidos >= :corte) AS streams, SUM(r.ms_reproduzidos) AS ms, %s
                FROM reproducao_musical r
                WHERE r.usuario_id = :usuarioId%s
                GROUP BY r.musica_uuid
            )
            SELECT c.artista_uuid, SUM(m.streams) AS streams, SUM(m.ms) AS ms, %s
            FROM por_musica m
            INNER JOIN creditos c ON c.musica_uuid = m.musica_uuid
            GROUP BY c.artista_uuid
            HAVING streams > 0
            ORDER BY %s
            LIMIT %d',
            self::CTE_CREDITOS,
            self::COLUNAS_POR_FONTE,
            $filtros,
            self::COLUNAS_POR_FONTE_SOMADAS,
            self::ORDEM,
            $limite,
        ), $parametros, $tipos);

        return array_map(ArtistaAnaliseSpotifyDTO::daLinha(...), $this->complementarArtistas($usuario, $linhas));
    }

    /**
     * @return list<array{ano: int, mes: int, posicao: int, chave: string, item: MusicaAnaliseSpotifyDTO|null}>
     */
    public function listarRankingMusicasPorMes(Usuario $usuario, FiltroFonteMusica $filtro, int $limiteComparacao, int $limiteExibido): array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, PeriodoAnaliseSpotifyDTO::todos(), $filtro);
        $parametros['limiteComparacao'] = $limiteComparacao;
        $tipos['limiteComparacao'] = ParameterType::INTEGER;

        $linhas = $this->consultar(sprintf(
            'WITH por_mes AS (
                SELECT YEAR(r.tocada_em) AS ano, MONTH(r.tocada_em) AS mes, r.musica_uuid,
                    SUM(r.ms_reproduzidos >= :corte) AS streams, SUM(r.ms_reproduzidos) AS ms, MAX(r.tocada_em) AS mais_recente, %s
                FROM reproducao_musical r
                WHERE r.usuario_id = :usuarioId%s
                GROUP BY ano, mes, r.musica_uuid
                HAVING streams > 0
            ), ranqueadas AS (
                SELECT p.*, ROW_NUMBER() OVER (PARTITION BY p.ano, p.mes ORDER BY p.streams DESC, p.ms DESC, p.mais_recente DESC) AS posicao
                FROM por_mes p
            )
            SELECT * FROM ranqueadas WHERE posicao <= :limiteComparacao ORDER BY ano, mes, posicao',
            self::COLUNAS_POR_FONTE,
            $filtros,
        ), $parametros, $tipos);

        $exibidas = array_values(array_filter($linhas, static fn (array $linha): bool => (int) $linha['posicao'] <= $limiteExibido));
        $musicas = array_map(MusicaAnaliseSpotifyDTO::daLinha(...), $this->complementarMusicas($usuario, $exibidas));
        $musicasPorChave = [];
        foreach ($exibidas as $indice => $linha) {
            $musicasPorChave[$linha['ano'].'|'.$linha['mes'].'|'.$linha['posicao']] = $musicas[$indice];
        }

        return array_map(static fn (array $linha): array => [
            'ano' => (int) $linha['ano'],
            'mes' => (int) $linha['mes'],
            'posicao' => (int) $linha['posicao'],
            'chave' => Uuid::fromBinary((string) $linha['musica_uuid'])->toRfc4122(),
            'item' => $musicasPorChave[$linha['ano'].'|'.$linha['mes'].'|'.$linha['posicao']] ?? null,
        ], $linhas);
    }

    /**
     * @return list<array{ano: int, mes: int, posicao: int, chave: string, item: ArtistaAnaliseSpotifyDTO|null}>
     */
    public function listarRankingArtistasPorMes(Usuario $usuario, FiltroFonteMusica $filtro, int $limiteComparacao, int $limiteExibido): array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, PeriodoAnaliseSpotifyDTO::todos(), $filtro);
        $parametros['limiteComparacao'] = $limiteComparacao;
        $tipos['limiteComparacao'] = ParameterType::INTEGER;

        $linhas = $this->consultar(sprintf(
            '%s, por_mes AS (
                SELECT YEAR(r.tocada_em) AS ano, MONTH(r.tocada_em) AS mes, c.artista_uuid,
                    SUM(r.ms_reproduzidos >= :corte) AS streams, SUM(r.ms_reproduzidos) AS ms, %s
                FROM reproducao_musical r
                INNER JOIN creditos c ON c.musica_uuid = r.musica_uuid
                WHERE r.usuario_id = :usuarioId%s
                GROUP BY ano, mes, c.artista_uuid
                HAVING streams > 0
            ), ranqueadas AS (
                SELECT p.*, ROW_NUMBER() OVER (PARTITION BY p.ano, p.mes ORDER BY p.streams DESC, p.ms DESC) AS posicao
                FROM por_mes p
            )
            SELECT * FROM ranqueadas WHERE posicao <= :limiteComparacao ORDER BY ano, mes, posicao',
            self::CTE_CREDITOS,
            self::COLUNAS_POR_FONTE,
            $filtros,
        ), $parametros, $tipos);

        $exibidas = array_values(array_filter($linhas, static fn (array $linha): bool => (int) $linha['posicao'] <= $limiteExibido));
        $artistas = array_map(ArtistaAnaliseSpotifyDTO::daLinha(...), $this->complementarArtistas($usuario, $exibidas));
        $artistasPorChave = [];
        foreach ($exibidas as $indice => $linha) {
            $artistasPorChave[$linha['ano'].'|'.$linha['mes'].'|'.$linha['posicao']] = $artistas[$indice];
        }

        return array_map(static fn (array $linha): array => [
            'ano' => (int) $linha['ano'],
            'mes' => (int) $linha['mes'],
            'posicao' => (int) $linha['posicao'],
            'chave' => Uuid::fromBinary((string) $linha['artista_uuid'])->toRfc4122(),
            'item' => $artistasPorChave[$linha['ano'].'|'.$linha['mes'].'|'.$linha['posicao']] ?? null,
        ], $linhas);
    }

    /**
     * @return list<AlbumAnaliseSpotifyDTO>
     */
    public function listarRankingAlbuns(
        Usuario $usuario,
        PeriodoAnaliseSpotifyDTO $periodo,
        FiltroFonteMusica $filtro,
        int $limite,
        ?AlvoAnaliseMusicaDTO $alvo = null,
    ): array {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro, $alvo);

        $linhas = $this->consultar(sprintf(
            "WITH musicas AS (
                SELECT r.musica_uuid, SUM(r.ms_reproduzidos >= :corte) AS streams, SUM(r.ms_reproduzidos) AS ms, %s
                FROM reproducao_musical r
                WHERE r.usuario_id = :usuarioId%s
                GROUP BY r.musica_uuid
                HAVING streams > 0
            ), com_album AS (
                SELECT mu.*, LOWER(TRIM(m.album)) AS chave_album,
                    (SELECT COALESCE(ac.unido_a_uuid, ac.uuid) FROM musica_artista_catalogo mac
                        INNER JOIN artista_catalogo ac ON ac.uuid = mac.artista_uuid
                        WHERE mac.musica_uuid = mu.musica_uuid ORDER BY mac.posicao LIMIT 1) AS chave_artista
                FROM musicas mu
                INNER JOIN musica_catalogo m ON m.uuid = mu.musica_uuid
                WHERE m.album IS NOT NULL AND m.album <> '' AND m.album <> 'Desconhecido'
            ), ranqueadas AS (
                SELECT c.musica_uuid, c.chave_album, c.chave_artista,
                    ROW_NUMBER() OVER (PARTITION BY chave_album, chave_artista ORDER BY streams DESC, ms DESC) AS ordem,
                    SUM(streams) OVER (PARTITION BY chave_album, chave_artista) AS total_streams,
                    SUM(ms) OVER (PARTITION BY chave_album, chave_artista) AS total_ms,
                    COUNT(*) OVER (PARTITION BY chave_album, chave_artista) AS faixas_distintas,
                    SUM(qtd_spotify) OVER (PARTITION BY chave_album, chave_artista) AS qtd_spotify,
                    SUM(qtd_youtube_music) OVER (PARTITION BY chave_album, chave_artista) AS qtd_youtube_music,
                    SUM(streams_spotify) OVER (PARTITION BY chave_album, chave_artista) AS streams_spotify,
                    SUM(ms_spotify) OVER (PARTITION BY chave_album, chave_artista) AS ms_spotify,
                    SUM(streams_youtube_music) OVER (PARTITION BY chave_album, chave_artista) AS streams_youtube_music,
                    SUM(ms_youtube_music) OVER (PARTITION BY chave_album, chave_artista) AS ms_youtube_music,
                    SUM(ms_estimado) OVER (PARTITION BY chave_album, chave_artista) AS ms_estimado
                FROM com_album c
            )
            SELECT musica_uuid, total_streams, total_ms, faixas_distintas, qtd_spotify, qtd_youtube_music,
                streams_spotify, ms_spotify, streams_youtube_music, ms_youtube_music, ms_estimado
            FROM ranqueadas
            WHERE ordem = 1
            ORDER BY total_streams DESC, total_ms DESC
            LIMIT %d",
            self::COLUNAS_POR_FONTE,
            $filtros,
            $limite,
        ), $parametros, $tipos);

        return array_map(AlbumAnaliseSpotifyDTO::daLinha(...), $this->complementarMusicas($usuario, $linhas));
    }

    /**
     * @return array{minutos: int, streams: int, reproducoes: int, artistas: int, musicas: int, faixas: int, dias: int, primeira: ?string, ultima: ?string, porFonte: array<string, array{streams: int, minutos: int}>, minutosEstimados: int}
     */
    public function calcularTotais(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro): array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro);

        $linha = $this->consultarLinha(sprintf(
            'SELECT COALESCE(SUM(r.ms_reproduzidos), 0) AS ms, COALESCE(SUM(r.ms_reproduzidos >= :corte), 0) AS streams, COUNT(*) AS reproducoes,
                COUNT(DISTINCT r.musica_uuid) AS musicas, COUNT(DISTINCT DATE(%s)) AS dias, MIN(r.tocada_em) AS primeira, MAX(r.tocada_em) AS ultima, %s
            FROM reproducao_musical r
            WHERE r.usuario_id = :usuarioId%s',
            $periodo->expressaoData(),
            self::COLUNAS_POR_FONTE,
            $filtros,
        ), $parametros, $tipos) ?? [];
        $artistas = $this->consultarLinha(sprintf(
            '%s SELECT COUNT(DISTINCT c.artista_uuid) AS artistas
            FROM (SELECT DISTINCT r.musica_uuid FROM reproducao_musical r WHERE r.usuario_id = :usuarioId%s) m
            INNER JOIN creditos c ON c.musica_uuid = m.musica_uuid',
            self::CTE_CREDITOS,
            $filtros,
        ), $parametros, $tipos);

        return [
            'minutos' => $this->paraMinutos($linha['ms'] ?? 0),
            'streams' => (int) ($linha['streams'] ?? 0),
            'reproducoes' => (int) ($linha['reproducoes'] ?? 0),
            'artistas' => (int) ($artistas['artistas'] ?? 0),
            'musicas' => (int) ($linha['musicas'] ?? 0),
            'faixas' => (int) ($linha['musicas'] ?? 0),
            'dias' => (int) ($linha['dias'] ?? 0),
            'primeira' => is_string($linha['primeira'] ?? null) ? $linha['primeira'] : null,
            'ultima' => is_string($linha['ultima'] ?? null) ? $linha['ultima'] : null,
            'porFonte' => $this->dividirPorFonte($linha),
            'minutosEstimados' => $this->paraMinutos($linha['ms_estimado'] ?? 0),
        ];
    }

    /**
     * @return list<array{diaSemana: int, hora: int, minutos: int, streams: int}>
     */
    public function calcularMapaHorarios(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro): array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro);

        $linhas = $this->consultar(sprintf(
            'SELECT DAYOFWEEK(%1$s) - 1 AS dia_semana, HOUR(%1$s) AS hora, SUM(r.ms_reproduzidos) AS ms, SUM(r.ms_reproduzidos >= :corte) AS streams
            FROM reproducao_musical r
            WHERE r.usuario_id = :usuarioId%2$s
            GROUP BY dia_semana, hora',
            self::DATA_LOCAL,
            $filtros,
        ), $parametros, $tipos);

        return array_map(fn (array $linha): array => [
            'diaSemana' => (int) $linha['dia_semana'],
            'hora' => (int) $linha['hora'],
            'minutos' => $this->paraMinutos($linha['ms']),
            'streams' => (int) $linha['streams'],
        ], $linhas);
    }

    public function calcularMinutosTopArtistas(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro, int $quantidade): int
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro);

        $linha = $this->consultarLinha(sprintf(
            '%1$s, por_musica AS (
                SELECT r.musica_uuid, SUM(r.ms_reproduzidos >= :corte) AS streams, SUM(r.ms_reproduzidos) AS ms
                FROM reproducao_musical r
                WHERE r.usuario_id = :usuarioId%2$s
                GROUP BY r.musica_uuid
            ), topo AS (
                SELECT c.artista_uuid FROM por_musica m INNER JOIN creditos c ON c.musica_uuid = m.musica_uuid
                GROUP BY c.artista_uuid
                HAVING SUM(m.streams) > 0
                ORDER BY SUM(m.streams) DESC, SUM(m.ms) DESC
                LIMIT %3$d
            )
            SELECT COALESCE(SUM(m.ms), 0) AS ms FROM por_musica m
            WHERE m.musica_uuid IN (SELECT c.musica_uuid FROM creditos c INNER JOIN topo t ON t.artista_uuid = c.artista_uuid)',
            self::CTE_CREDITOS,
            $filtros,
            $quantidade,
        ), $parametros, $tipos);

        return $this->paraMinutos($linha['ms'] ?? 0);
    }

    /**
     * @return array{faixasComStream: int, faixasUmaVez: int}
     */
    public function contarFaixasPorRepeticao(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro): array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro);

        $linha = $this->consultarLinha(sprintf(
            'SELECT COUNT(*) AS faixas, COALESCE(SUM(vezes = 1), 0) AS uma_vez FROM (
                SELECT COUNT(*) AS vezes
                FROM reproducao_musical r
                WHERE r.usuario_id = :usuarioId AND r.ms_reproduzidos >= :corte%s
                GROUP BY r.musica_uuid
            ) faixas',
            $filtros,
        ), $parametros, $tipos);

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
        FiltroFonteMusica $filtro,
        ?AlvoAnaliseMusicaDTO $alvo = null,
    ): array {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro, $alvo);

        $linha = $this->consultarLinha(sprintf(
            'SELECT COALESCE(SUM(r.pulada IS NOT NULL), 0) AS com_pulo, COALESCE(SUM(r.pulada = 1), 0) AS puladas,
                COALESCE(SUM(r.aleatorio IS NOT NULL), 0) AS com_aleatorio, COALESCE(SUM(r.aleatorio = 1), 0) AS aleatorias
            FROM reproducao_musical r
            WHERE r.usuario_id = :usuarioId%s',
            $filtros,
        ), $parametros, $tipos);

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
    public function listarDiasOuvidos(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro): array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro);

        $linhas = $this->consultar(sprintf(
            'SELECT DISTINCT DATE(%s) AS dia
            FROM reproducao_musical r
            WHERE r.usuario_id = :usuarioId AND r.ms_reproduzidos >= :corte%s
            ORDER BY dia ASC',
            $periodo->expressaoData(),
            $filtros,
        ), $parametros, $tipos);

        return array_map(static fn (array $linha): string => (string) $linha['dia'], $linhas);
    }

    /**
     * @return array{data: string, minutos: int}|null
     */
    public function buscarDiaRecorde(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro): ?array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro);

        $linha = $this->consultarLinha(sprintf(
            'SELECT DATE(%s) AS dia, SUM(r.ms_reproduzidos) AS ms
            FROM reproducao_musical r
            WHERE r.usuario_id = :usuarioId%s
            GROUP BY dia
            ORDER BY ms DESC
            LIMIT 1',
            $periodo->expressaoData(),
            $filtros,
        ), $parametros, $tipos);

        if (null === $linha) {
            return null;
        }

        return ['data' => (string) $linha['dia'], 'minutos' => $this->paraMinutos($linha['ms'])];
    }

    /**
     * @return array{musica: MusicaAnaliseSpotifyDTO, vezes: int, data: string}|null
     */
    public function buscarMaiorRepeticaoDiaria(
        Usuario $usuario,
        PeriodoAnaliseSpotifyDTO $periodo,
        FiltroFonteMusica $filtro,
        ?AlvoAnaliseMusicaDTO $alvo = null,
    ): ?array {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro, $alvo);

        $linha = $this->consultarLinha(sprintf(
            'SELECT DATE(%s) AS dia, r.musica_uuid, COUNT(*) AS streams, SUM(r.ms_reproduzidos) AS ms
            FROM reproducao_musical r
            WHERE r.usuario_id = :usuarioId AND r.ms_reproduzidos >= :corte%s
            GROUP BY dia, r.musica_uuid
            ORDER BY streams DESC, dia DESC
            LIMIT 1',
            $periodo->expressaoData(),
            $filtros,
        ), $parametros, $tipos);

        if (null === $linha) {
            return null;
        }

        $completa = $this->complementarMusicas($usuario, [$linha])[0];

        return [
            'musica' => MusicaAnaliseSpotifyDTO::daLinha($completa),
            'vezes' => (int) $linha['streams'],
            'data' => (string) $linha['dia'],
        ];
    }

    /**
     * @return list<array{ano: int, mes: int, streams: int, minutos: int, porFonte: array<string, array{streams: int, minutos: int}>}>
     */
    public function calcularEvolucaoMensal(
        Usuario $usuario,
        PeriodoAnaliseSpotifyDTO $periodo,
        FiltroFonteMusica $filtro,
        ?AlvoAnaliseMusicaDTO $alvo = null,
    ): array {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro, $alvo);

        $linhas = $this->consultar(sprintf(
            'SELECT YEAR(%1$s) AS ano, MONTH(%1$s) AS mes, SUM(r.ms_reproduzidos >= :corte) AS streams, SUM(r.ms_reproduzidos) AS ms, %3$s
            FROM reproducao_musical r
            WHERE r.usuario_id = :usuarioId%2$s
            GROUP BY ano, mes
            ORDER BY ano ASC, mes ASC',
            $periodo->expressaoData(),
            $filtros,
            self::COLUNAS_POR_FONTE,
        ), $parametros, $tipos);

        return array_map(fn (array $linha): array => [
            'ano' => (int) $linha['ano'],
            'mes' => (int) $linha['mes'],
            'streams' => (int) $linha['streams'],
            'minutos' => $this->paraMinutos($linha['ms']),
            'porFonte' => $this->dividirPorFonte($linha),
        ], $linhas);
    }

    /**
     * @return list<array{ano: int, mes: int, posicao: int}>
     */
    public function listarMesesNoTopo(Usuario $usuario, FiltroFonteMusica $filtro, AlvoAnaliseMusicaDTO $alvo, int $tamanhoTopo): array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, PeriodoAnaliseSpotifyDTO::todos(), $filtro);
        [$prefixo, $juncao, $chave, $valorAlvo] = $this->agrupamentoAlvo($alvo, $parametros, $tipos);

        $linhas = $this->consultar(sprintf(
            '%1$s mensal AS (
                SELECT YEAR(r.tocada_em) AS ano, MONTH(r.tocada_em) AS mes, %2$s AS chave, SUM(r.ms_reproduzidos >= :corte) AS streams, SUM(r.ms_reproduzidos) AS ms
                FROM reproducao_musical r %3$s
                WHERE r.usuario_id = :usuarioId%4$s
                GROUP BY ano, mes, chave
                HAVING streams > 0
            ), ranqueado AS (
                SELECT m.*, ROW_NUMBER() OVER (PARTITION BY ano, mes ORDER BY streams DESC, ms DESC) AS posicao
                FROM mensal m
            )
            SELECT ano, mes, posicao FROM ranqueado
            WHERE chave = %5$s AND posicao <= %6$d
            ORDER BY ano ASC, mes ASC',
            $prefixo,
            $chave,
            $juncao,
            $filtros,
            $valorAlvo,
            $tamanhoTopo,
        ), $parametros, $tipos);

        return array_map(static fn (array $linha): array => [
            'ano' => (int) $linha['ano'],
            'mes' => (int) $linha['mes'],
            'posicao' => (int) $linha['posicao'],
        ], $linhas);
    }

    public function buscarPosicaoGeral(Usuario $usuario, FiltroFonteMusica $filtro, AlvoAnaliseMusicaDTO $alvo): ?int
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, PeriodoAnaliseSpotifyDTO::todos(), $filtro);
        [$prefixo, $juncao, $chave, $valorAlvo] = $this->agrupamentoAlvo($alvo, $parametros, $tipos);

        $linha = $this->consultarLinha(sprintf(
            '%1$s totais AS (
                SELECT %2$s AS chave, SUM(r.ms_reproduzidos >= :corte) AS streams, SUM(r.ms_reproduzidos) AS ms
                FROM reproducao_musical r %3$s
                WHERE r.usuario_id = :usuarioId%4$s
                GROUP BY chave
                HAVING streams > 0
            ), ranqueado AS (
                SELECT chave, ROW_NUMBER() OVER (ORDER BY streams DESC, ms DESC) AS posicao FROM totais
            )
            SELECT posicao FROM ranqueado WHERE chave = %5$s',
            $prefixo,
            $chave,
            $juncao,
            $filtros,
            $valorAlvo,
        ), $parametros, $tipos);

        return null === $linha ? null : (int) $linha['posicao'];
    }

    /**
     * @return array{streams: int, ms: int, reproducoes: int, faixas: int, albuns: int, dias: int, primeira: string, ultima: string, porFonte: array<string, array{streams: int, minutos: int, primeira: ?string, ultima: ?string}>, minutosEstimados: int}|null
     */
    public function buscarResumoAlvo(Usuario $usuario, FiltroFonteMusica $filtro, AlvoAnaliseMusicaDTO $alvo): ?array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, PeriodoAnaliseSpotifyDTO::todos(), $filtro, $alvo);

        $linha = $this->consultarLinha(sprintf(
            'SELECT COALESCE(SUM(r.ms_reproduzidos >= :corte), 0) AS streams, COALESCE(SUM(r.ms_reproduzidos), 0) AS ms, COUNT(*) AS reproducoes,
                COUNT(DISTINCT r.musica_uuid) AS faixas, COUNT(DISTINCT LOWER(TRIM(m.album))) AS albuns, COUNT(DISTINCT DATE(r.tocada_em)) AS dias,
                MIN(r.tocada_em) AS primeira, MAX(r.tocada_em) AS ultima, %s, %s
            FROM reproducao_musical r
            INNER JOIN musica_catalogo m ON m.uuid = r.musica_uuid
            WHERE r.usuario_id = :usuarioId%s',
            self::COLUNAS_POR_FONTE,
            self::COLUNAS_DATAS_POR_FONTE,
            $filtros,
        ), $parametros, $tipos);

        if (null === $linha || 0 === (int) $linha['reproducoes']) {
            return null;
        }

        $porFonte = [];
        foreach ($this->dividirPorFonte($linha) as $fonte => $valores) {
            $porFonte[$fonte] = [
                ...$valores,
                'primeira' => PeriodoAnaliseSpotifyDTO::utcParaIsoLocal(is_string($linha['primeira_'.$fonte]) ? $linha['primeira_'.$fonte] : null),
                'ultima' => PeriodoAnaliseSpotifyDTO::utcParaIsoLocal(is_string($linha['ultima_'.$fonte]) ? $linha['ultima_'.$fonte] : null),
            ];
        }

        return [
            'streams' => (int) $linha['streams'],
            'ms' => (int) $linha['ms'],
            'reproducoes' => (int) $linha['reproducoes'],
            'faixas' => (int) $linha['faixas'],
            'albuns' => (int) $linha['albuns'],
            'dias' => (int) $linha['dias'],
            'primeira' => (string) $linha['primeira'],
            'ultima' => (string) $linha['ultima'],
            'porFonte' => $porFonte,
            'minutosEstimados' => $this->paraMinutos($linha['ms_estimado']),
        ];
    }

    public function buscarDuracaoMusica(Usuario $usuario, Uuid $musica): ?int
    {
        $linha = $this->consultarLinha(
            "SELECT COALESCE(
                (SELECT MAX(rs.duracao_ms) FROM reproducao_musical r
                    INNER JOIN reproducao_spotify rs ON rs.uuid = UUID_TO_BIN(r.origem_id)
                    WHERE r.usuario_id = :usuarioId AND r.musica_uuid = :musicaAlvo AND r.fonte = 'spotify'),
                (SELECT MAX(v.duracao_ms) FROM video_youtube v WHERE v.usuario_id = :usuarioId AND v.musica_catalogo_uuid = :musicaAlvo)
            ) AS duracao",
            ['usuarioId' => $usuario->getId(), 'musicaAlvo' => $musica->toBinary()],
            ['musicaAlvo' => ParameterType::BINARY],
        );

        return null === ($linha['duracao'] ?? null) ? null : (int) $linha['duracao'];
    }

    /**
     * @return list<array{fonte: string, titulo: string, canal: string, codigo: ?string, videoUuid: ?string, tipoVersao: ?string, urlCapa: ?string, url: ?string, streams: int, minutos: int}>
     */
    public function listarVariantesMusica(Usuario $usuario, FiltroFonteMusica $filtro, Uuid $musica, ?PeriodoAnaliseSpotifyDTO $periodo = null): array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo ?? PeriodoAnaliseSpotifyDTO::todos(), $filtro, AlvoAnaliseMusicaDTO::daMusica($musica));

        $linhas = $this->consultar(sprintf(
            "SELECT 'youtube_music' AS fonte, v.titulo, v.canal, v.video_id AS codigo, v.tipo_versao, v.url_capa, BIN_TO_UUID(v.uuid) AS video_uuid,
                SUM(r.ms_reproduzidos >= :corte) AS streams, SUM(r.ms_reproduzidos) AS ms
            FROM reproducao_musical r
            INNER JOIN reproducao_youtube ry ON ry.uuid = UUID_TO_BIN(r.origem_id)
            INNER JOIN video_youtube v ON v.uuid = ry.video_uuid
            WHERE r.usuario_id = :usuarioId AND r.fonte = 'youtube_music'%1\$s
            GROUP BY v.uuid, v.video_id, v.titulo, v.canal, v.tipo_versao, v.url_capa
            UNION ALL
            SELECT 'spotify', rs.nome_faixa, rs.artista_principal, MAX(rs.codigo_faixa), NULL, NULL, NULL,
                SUM(r.ms_reproduzidos >= :corte), SUM(r.ms_reproduzidos)
            FROM reproducao_musical r
            INNER JOIN reproducao_spotify rs ON rs.uuid = UUID_TO_BIN(r.origem_id)
            WHERE r.usuario_id = :usuarioId AND r.fonte = 'spotify'%1\$s
            GROUP BY rs.nome_faixa, rs.artista_principal
            ORDER BY streams DESC, ms DESC",
            $filtros,
        ), $parametros, $tipos);

        return array_map(fn (array $linha): array => [
            'fonte' => (string) $linha['fonte'],
            'titulo' => (string) $linha['titulo'],
            'canal' => (string) $linha['canal'],
            'codigo' => is_string($linha['codigo']) && '' !== $linha['codigo'] ? $linha['codigo'] : null,
            'videoUuid' => is_string($linha['video_uuid']) ? $linha['video_uuid'] : null,
            'tipoVersao' => is_string($linha['tipo_versao']) ? $linha['tipo_versao'] : null,
            'urlCapa' => is_string($linha['url_capa']) ? $linha['url_capa'] : null,
            'url' => $this->montarUrlVariante((string) $linha['fonte'], is_string($linha['codigo']) ? $linha['codigo'] : null),
            'streams' => (int) $linha['streams'],
            'minutos' => $this->paraMinutos($linha['ms']),
        ], $linhas);
    }

    /**
     * @return list<array{artista: ArtistaAnaliseSpotifyDTO, primeira: string}>
     */
    public function listarArtistasNovos(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro): array
    {
        if ($periodo->isTodos()) {
            return [];
        }

        [$parametros, $tipos, $filtros] = $this->montarFiltrosAte($usuario, $periodo, $filtro);

        $linhas = $this->consultar(sprintf(
            '%s
            , por_musica AS (
                SELECT r.musica_uuid, MIN(r.tocada_em) AS primeira,
                    SUM(r.tocada_em >= :inicioUtc AND r.ms_reproduzidos >= :corte) AS streams,
                    SUM(CASE WHEN r.tocada_em >= :inicioUtc THEN r.ms_reproduzidos ELSE 0 END) AS ms
                FROM reproducao_musical r
                WHERE r.usuario_id = :usuarioId%s
                GROUP BY r.musica_uuid
            )
            SELECT c.artista_uuid, MIN(m.primeira) AS primeira, SUM(m.streams) AS streams, SUM(m.ms) AS ms
            FROM por_musica m INNER JOIN creditos c ON c.musica_uuid = m.musica_uuid
            GROUP BY c.artista_uuid
            HAVING primeira >= :inicioUtc
            ORDER BY %s',
            self::CTE_CREDITOS,
            $filtros,
            self::ORDEM,
        ), $parametros, $tipos);

        return array_map(static fn (array $linha): array => [
            'artista' => ArtistaAnaliseSpotifyDTO::daLinha($linha),
            'primeira' => (string) $linha['primeira'],
        ], $this->complementarArtistas($usuario, $linhas));
    }

    public function contarArtistasNovos(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro): int
    {
        if ($periodo->isTodos()) {
            return 0;
        }

        [$parametros, $tipos, $filtros] = $this->montarFiltrosAte($usuario, $periodo, $filtro);

        $linha = $this->consultarLinha(sprintf(
            '%s
            , por_musica AS (
                SELECT r.musica_uuid, MIN(r.tocada_em) AS primeira
                FROM reproducao_musical r
                WHERE r.usuario_id = :usuarioId%s
                GROUP BY r.musica_uuid
            )
            SELECT COUNT(*) AS total FROM (
                SELECT c.artista_uuid
                FROM por_musica m INNER JOIN creditos c ON c.musica_uuid = m.musica_uuid
                GROUP BY c.artista_uuid
                HAVING MIN(m.primeira) >= :inicioUtc
            ) novos',
            self::CTE_CREDITOS,
            $filtros,
        ), $parametros, $tipos);

        return (int) ($linha['total'] ?? 0);
    }

    /**
     * @return list<array{musica: MusicaAnaliseSpotifyDTO, primeira: string}>
     */
    public function listarMusicasNovas(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro): array
    {
        if ($periodo->isTodos()) {
            return [];
        }

        [$parametros, $tipos, $filtros] = $this->montarFiltrosAte($usuario, $periodo, $filtro);

        $linhas = $this->consultar(sprintf(
            'SELECT r.musica_uuid, MIN(r.tocada_em) AS primeira,
                SUM(r.tocada_em >= :inicioUtc AND r.ms_reproduzidos >= :corte) AS streams,
                SUM(CASE WHEN r.tocada_em >= :inicioUtc THEN r.ms_reproduzidos ELSE 0 END) AS ms
            FROM reproducao_musical r
            WHERE r.usuario_id = :usuarioId%s
            GROUP BY r.musica_uuid
            HAVING primeira >= :inicioUtc AND streams > 0
            ORDER BY %s',
            $filtros,
            self::ORDEM,
        ), $parametros, $tipos);

        return array_map(static fn (array $linha): array => [
            'musica' => MusicaAnaliseSpotifyDTO::daLinha($linha),
            'primeira' => (string) $linha['primeira'],
        ], $this->complementarMusicas($usuario, $linhas));
    }

    /**
     * @return list<array{artista: ArtistaAnaliseSpotifyDTO, ultimaAntes: string, voltouEm: string}>
     */
    public function listarRedescobertas(
        Usuario $usuario,
        PeriodoAnaliseSpotifyDTO $periodo,
        FiltroFonteMusica $filtro,
        int $diasAusencia,
        int $limite,
    ): array {
        if ($periodo->isTodos()) {
            return [];
        }

        [$parametros, $tipos, $filtros] = $this->montarFiltrosAte($usuario, $periodo, $filtro);

        $linhas = $this->consultar(sprintf(
            '%1$s
            SELECT p.artista_uuid, p.streams, p.ms, a.ultima_antes, p.voltou_em
            FROM (
                SELECT c.artista_uuid, COUNT(*) AS streams, SUM(r.ms_reproduzidos) AS ms, MIN(r.tocada_em) AS voltou_em
                FROM reproducao_musical r INNER JOIN creditos c ON c.musica_uuid = r.musica_uuid
                WHERE r.usuario_id = :usuarioId AND r.ms_reproduzidos >= :corte AND r.tocada_em >= :inicioUtc%2$s
                GROUP BY c.artista_uuid
            ) p
            INNER JOIN (
                SELECT c.artista_uuid, MAX(r.tocada_em) AS ultima_antes
                FROM reproducao_musical r INNER JOIN creditos c ON c.musica_uuid = r.musica_uuid
                WHERE r.usuario_id = :usuarioId AND r.tocada_em < :inicioUtc AND r.fonte IN (:fontes)
                GROUP BY c.artista_uuid
            ) a ON a.artista_uuid = p.artista_uuid
            WHERE a.ultima_antes < DATE_SUB(p.voltou_em, INTERVAL %3$d DAY)
            ORDER BY p.streams DESC, p.ms DESC
            LIMIT %4$d',
            self::CTE_CREDITOS,
            $filtros,
            $diasAusencia,
            $limite,
        ), $parametros, $tipos);

        return array_map(static fn (array $linha): array => [
            'artista' => ArtistaAnaliseSpotifyDTO::daLinha($linha),
            'ultimaAntes' => (string) $linha['ultima_antes'],
            'voltouEm' => (string) $linha['voltou_em'],
        ], $this->complementarArtistas($usuario, $linhas));
    }

    /**
     * @return list<array{musica: MusicaAnaliseSpotifyDTO, vezesNaJanela: int, fimJanela: string, total: int}>
     */
    public function listarObsessoes(
        Usuario $usuario,
        PeriodoAnaliseSpotifyDTO $periodo,
        FiltroFonteMusica $filtro,
        int $diasJanela,
        int $minimoNaJanela,
        int $limite,
    ): array {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro);

        $linhas = $this->consultar(sprintf(
            'WITH base AS (
                SELECT r.musica_uuid, r.tocada_em, r.ms_reproduzidos,
                    COUNT(*) OVER (
                        PARTITION BY r.musica_uuid
                        ORDER BY r.tocada_em
                        RANGE BETWEEN INTERVAL %1$d DAY PRECEDING AND CURRENT ROW
                    ) AS janela
                FROM reproducao_musical r
                WHERE r.usuario_id = :usuarioId AND r.ms_reproduzidos >= :corte%2$s
            ), picos AS (
                SELECT b.*,
                    ROW_NUMBER() OVER (PARTITION BY musica_uuid ORDER BY janela DESC, tocada_em ASC) AS ordem,
                    COUNT(*) OVER (PARTITION BY musica_uuid) AS total,
                    SUM(ms_reproduzidos) OVER (PARTITION BY musica_uuid) AS soma_ms
                FROM base b
            )
            SELECT musica_uuid, tocada_em AS fim_janela, janela, total AS streams, soma_ms AS ms
            FROM picos
            WHERE ordem = 1 AND janela >= %3$d
            ORDER BY janela DESC, total DESC
            LIMIT %4$d',
            $diasJanela,
            $filtros,
            $minimoNaJanela,
            $limite,
        ), $parametros, $tipos);

        return array_map(static fn (array $linha): array => [
            'musica' => MusicaAnaliseSpotifyDTO::daLinha($linha),
            'vezesNaJanela' => (int) $linha['janela'],
            'fimJanela' => (string) $linha['fim_janela'],
            'total' => (int) $linha['streams'],
        ], $this->complementarMusicas($usuario, $linhas));
    }

    public function buscarPrimeiraMusica(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro): ?MusicaAnaliseSpotifyDTO
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro);

        $linha = $this->consultarLinha(sprintf(
            'SELECT r.musica_uuid, 1 AS streams, r.ms_reproduzidos AS ms
            FROM reproducao_musical r
            WHERE r.usuario_id = :usuarioId AND r.ms_reproduzidos >= :corte%s
            ORDER BY r.tocada_em ASC
            LIMIT 1',
            $filtros,
        ), $parametros, $tipos);

        return null === $linha ? null : MusicaAnaliseSpotifyDTO::daLinha($this->complementarMusicas($usuario, [$linha])[0]);
    }

    /**
     * @return list<MesDisponivelDTO>
     */
    public function listarMesesDisponiveis(Usuario $usuario, FiltroFonteMusica $filtro): array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, PeriodoAnaliseSpotifyDTO::todos(), $filtro);

        $linhas = $this->consultar(sprintf(
            'SELECT YEAR(r.tocada_em) AS ano, MONTH(r.tocada_em) AS mes, COUNT(*) AS total, SUM(r.ms_reproduzidos) AS ms
            FROM reproducao_musical r
            WHERE r.usuario_id = :usuarioId%s
            GROUP BY ano, mes
            ORDER BY ano DESC, mes DESC',
            $filtros,
        ), $parametros, $tipos);

        return array_map(fn (array $linha): MesDisponivelDTO => new MesDisponivelDTO(
            ano: (int) $linha['ano'],
            mes: (int) $linha['mes'],
            totalReproducoes: (int) $linha['total'],
            totalMinutos: $this->paraMinutos($linha['ms']),
        ), $linhas);
    }

    /**
     * @return list<MinutosPorDiaDTO>
     */
    public function calcularMinutosPorDia(Usuario $usuario, PeriodoMesSpotifyDTO $periodo, FiltroFonteMusica $filtro): array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, PeriodoAnaliseSpotifyDTO::doMes($periodo->ano(), $periodo->mes()), $filtro);

        $linhas = $this->consultar(sprintf(
            'SELECT DAY(r.tocada_em) AS dia, SUM(r.ms_reproduzidos) AS ms
            FROM reproducao_musical r
            WHERE r.usuario_id = :usuarioId%s
            GROUP BY dia',
            $filtros,
        ), $parametros, $tipos);
        $porDia = [];
        foreach ($linhas as $linha) {
            $porDia[(int) $linha['dia']] = $this->paraMinutos($linha['ms']);
        }

        $diasNoMes = (int) $periodo->inicioUtc()->format('t');
        $resultado = [];
        for ($dia = 1; $dia <= $diasNoMes; ++$dia) {
            $resultado[] = new MinutosPorDiaDTO(
                data: sprintf('%04d-%02d-%02d', $periodo->ano(), $periodo->mes(), $dia),
                dia: $dia,
                minutos: $porDia[$dia] ?? 0,
            );
        }

        return $resultado;
    }

    /**
     * @return array{horarioPico: ?string, minutosHorarioPico: int, diaSemana: ?string, minutosDiaSemana: int, diaMaisLongo: ?string, minutosDiaMaisLongo: int}
     */
    public function calcularPicosDoPeriodo(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro): array
    {
        $hora = $this->buscarGrupoMaisOuvido($usuario, $periodo, $filtro, sprintf('HOUR(%s)', self::DATA_LOCAL));
        $diaSemana = $this->buscarGrupoMaisOuvido($usuario, $periodo, $filtro, sprintf('DAYOFWEEK(%s)', self::DATA_LOCAL));
        $dia = $this->buscarGrupoMaisOuvido($usuario, $periodo, $filtro, sprintf('DATE(%s)', $periodo->expressaoData()));

        return [
            'horarioPico' => null === $hora ? null : sprintf('%02dh — %02dh', (int) $hora['grupo'], ((int) $hora['grupo'] + 1) % 24),
            'minutosHorarioPico' => $hora['minutos'] ?? 0,
            'diaSemana' => null === $diaSemana ? null : (self::DIAS_SEMANA[(int) $diaSemana['grupo']] ?? null),
            'minutosDiaSemana' => $diaSemana['minutos'] ?? 0,
            'diaMaisLongo' => null === $dia ? null : (string) $dia['grupo'],
            'minutosDiaMaisLongo' => $dia['minutos'] ?? 0,
        ];
    }

    /**
     * @return list<array{ano: int, streams: int, minutos: int, musicas: int}>
     */
    public function listarNesteDia(Usuario $usuario, FiltroFonteMusica $filtro, int $mes, int $dia): array
    {
        $parametros = [
            'usuarioId' => $usuario->getId(),
            'corte' => self::CORTE_STREAM_MS,
            'fontes' => $filtro->valoresFontes(),
            'mes' => $mes,
            'dia' => $dia,
        ];
        $tipos = ['fontes' => ArrayParameterType::STRING];

        $linhas = $this->consultar(sprintf(
            'SELECT YEAR(%1$s) AS ano,
                SUM(r.ms_reproduzidos >= :corte) AS streams,
                SUM(r.ms_reproduzidos) AS ms,
                COUNT(DISTINCT r.musica_uuid) AS musicas
            FROM reproducao_musical r
            WHERE r.usuario_id = :usuarioId AND r.fonte IN (:fontes)
                AND MONTH(%1$s) = :mes AND DAY(%1$s) = :dia
            GROUP BY ano
            ORDER BY ano DESC',
            self::DATA_LOCAL,
        ), $parametros, $tipos);

        return array_map(fn (array $linha): array => [
            'ano' => (int) $linha['ano'],
            'streams' => (int) $linha['streams'],
            'minutos' => $this->paraMinutos($linha['ms']),
            'musicas' => (int) $linha['musicas'],
        ], $linhas);
    }

    /**
     * @return list<array{nome: string, artista: string, musicaUuid: string, streams: int, minutos: int, ultima: string, diasSemOuvir: int}>
     */
    public function listarMusicasSaudade(Usuario $usuario, FiltroFonteMusica $filtro, int $diasSemOuvir = 90, int $limite = 30): array
    {
        $parametros = [
            'usuarioId' => $usuario->getId(),
            'corte' => self::CORTE_STREAM_MS,
            'fontes' => $filtro->valoresFontes(),
            'dias' => $diasSemOuvir,
            'limite' => $limite,
        ];
        $tipos = ['fontes' => ArrayParameterType::STRING, 'limite' => ParameterType::INTEGER];

        $linhas = $this->consultar(
            "SELECT m.titulo AS nome,
                COALESCE((
                    SELECT ac.nome FROM musica_artista_catalogo mac
                    INNER JOIN artista_catalogo ac ON ac.uuid = mac.artista_uuid
                    WHERE mac.musica_uuid = r.musica_uuid
                    ORDER BY mac.posicao ASC LIMIT 1
                ), 'Desconhecido') AS artista,
                BIN_TO_UUID(r.musica_uuid) AS musica_uuid,
                SUM(r.ms_reproduzidos >= :corte) AS streams,
                SUM(r.ms_reproduzidos) AS ms,
                DATE(CONVERT_TZ(MAX(r.tocada_em), '+00:00', '-03:00')) AS ultima,
                DATEDIFF(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '-03:00'), CONVERT_TZ(MAX(r.tocada_em), '+00:00', '-03:00')) AS dias_sem
            FROM reproducao_musical r
            INNER JOIN musica_catalogo m ON m.uuid = r.musica_uuid
            WHERE r.usuario_id = :usuarioId AND r.fonte IN (:fontes)
            GROUP BY r.musica_uuid, m.titulo
            HAVING dias_sem >= :dias AND streams >= 5
            ORDER BY streams DESC
            LIMIT :limite",
            $parametros,
            $tipos,
        );

        return array_map(fn (array $linha): array => [
            'nome' => (string) $linha['nome'],
            'artista' => (string) $linha['artista'],
            'musicaUuid' => (string) $linha['musica_uuid'],
            'streams' => (int) $linha['streams'],
            'minutos' => $this->paraMinutos($linha['ms']),
            'ultima' => (string) $linha['ultima'],
            'diasSemOuvir' => (int) $linha['dias_sem'],
        ], $linhas);
    }

    /**
     * @return list<array{tipo: string, streams: int, minutos: int, percentual: float}>
     */
    public function agregarVersoesAlteradas(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro): array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro);

        $linhas = $this->consultar(sprintf(
            "SELECT COALESCE(v.tipo_versao, 'original') AS tipo,
                SUM(r.ms_reproduzidos >= :corte) AS streams,
                SUM(r.ms_reproduzidos) AS ms
            FROM reproducao_musical r
            LEFT JOIN reproducao_youtube ry ON r.fonte = 'youtube_music' AND ry.uuid = UUID_TO_BIN(r.origem_id)
            LEFT JOIN video_youtube v ON v.uuid = ry.video_uuid
            WHERE r.usuario_id = :usuarioId%s
            GROUP BY tipo
            ORDER BY ms DESC",
            $filtros,
        ), $parametros, $tipos);

        $totalMs = array_sum(array_map(static fn (array $l): int => (int) $l['ms'], $linhas));

        return array_map(fn (array $linha): array => [
            'tipo' => (string) $linha['tipo'],
            'streams' => (int) $linha['streams'],
            'minutos' => $this->paraMinutos($linha['ms']),
            'percentual' => $totalMs > 0 ? round(((int) $linha['ms'] / $totalMs) * 100, 1) : 0.0,
        ], $linhas);
    }

    /**
     * @return list<array{nome: string, artista: string, musicaUuid: string, streams: int, minutos: int}>
     */
    public function listarRankingMashups(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro, int $limite = 20): array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro);
        $parametros['limite'] = $limite;
        $parametros['tipoMashup'] = TipoMusicaCatalogo::Mashup->value;
        $tipos['limite'] = ParameterType::INTEGER;

        $linhas = $this->consultar(sprintf(
            "SELECT m.titulo AS nome, BIN_TO_UUID(r.musica_uuid) AS musica_uuid,
                COALESCE((
                    SELECT GROUP_CONCAT(ac.nome ORDER BY mac.posicao SEPARATOR ', ')
                    FROM musica_artista_catalogo mac
                    INNER JOIN artista_catalogo ac ON ac.uuid = mac.artista_uuid
                    WHERE mac.musica_uuid = r.musica_uuid
                ), 'Vários') AS artista,
                SUM(r.ms_reproduzidos >= :corte) AS streams,
                SUM(r.ms_reproduzidos) AS ms
            FROM reproducao_musical r
            INNER JOIN musica_catalogo m ON m.uuid = r.musica_uuid
            WHERE r.usuario_id = :usuarioId AND m.tipo = :tipoMashup%s
            GROUP BY r.musica_uuid, m.titulo
            ORDER BY %s
            LIMIT :limite",
            $filtros,
            self::ORDEM,
        ), $parametros, $tipos);

        return array_map(fn (array $linha): array => [
            'nome' => (string) $linha['nome'],
            'artista' => (string) $linha['artista'],
            'musicaUuid' => (string) $linha['musica_uuid'],
            'streams' => (int) $linha['streams'],
            'minutos' => $this->paraMinutos($linha['ms']),
        ], $linhas);
    }

    /**
     * @return list<array{nome: string, artistaUuid: string, musicasDistintas: int, mesesAtivos: int, streams: int, minutos: int}>
     */
    public function listarProfundidadeArtistas(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro, int $limite = 30): array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro);
        $parametros['limite'] = $limite;
        $tipos['limite'] = ParameterType::INTEGER;

        $linhas = $this->consultar(sprintf(
            "%s
            SELECT ac.nome, BIN_TO_UUID(c.artista_uuid) AS artista_uuid,
                COUNT(DISTINCT r.musica_uuid) AS musicas,
                COUNT(DISTINCT DATE_FORMAT(%s, '%%Y-%%m')) AS meses,
                SUM(r.ms_reproduzidos >= :corte) AS streams,
                SUM(r.ms_reproduzidos) AS ms
            FROM reproducao_musical r
            INNER JOIN creditos c ON c.musica_uuid = r.musica_uuid
            INNER JOIN artista_catalogo ac ON ac.uuid = c.artista_uuid
            WHERE r.usuario_id = :usuarioId%s
            GROUP BY c.artista_uuid, ac.nome
            ORDER BY musicas DESC, ms DESC
            LIMIT :limite",
            self::CTE_CREDITOS,
            self::DATA_LOCAL,
            $filtros,
        ), $parametros, $tipos);

        return array_map(fn (array $linha): array => [
            'nome' => (string) $linha['nome'],
            'artistaUuid' => (string) $linha['artista_uuid'],
            'musicasDistintas' => (int) $linha['musicas'],
            'mesesAtivos' => (int) $linha['meses'],
            'streams' => (int) $linha['streams'],
            'minutos' => $this->paraMinutos($linha['ms']),
        ], $linhas);
    }

    /**
     * @return list<array{nome: string, artista: string, musicaUuid: string, tocadaEm: string, minutos: int, fonte: string}>
     */
    public function listarReproducoesDoDia(Usuario $usuario, FiltroFonteMusica $filtro, string $dataLocal, int $limite = 200): array
    {
        $parametros = [
            'usuarioId' => $usuario->getId(),
            'fontes' => $filtro->valoresFontes(),
            'dia' => $dataLocal,
            'limite' => $limite,
        ];
        $tipos = ['fontes' => ArrayParameterType::STRING, 'limite' => ParameterType::INTEGER];

        $linhas = $this->consultar(sprintf(
            "SELECT m.titulo AS nome, BIN_TO_UUID(r.musica_uuid) AS musica_uuid, r.fonte,
                COALESCE((
                    SELECT ac.nome FROM musica_artista_catalogo mac
                    INNER JOIN artista_catalogo ac ON ac.uuid = mac.artista_uuid
                    WHERE mac.musica_uuid = r.musica_uuid
                    ORDER BY mac.posicao ASC LIMIT 1
                ), 'Desconhecido') AS artista,
                %s AS tocada_local,
                r.ms_reproduzidos AS ms
            FROM reproducao_musical r
            INNER JOIN musica_catalogo m ON m.uuid = r.musica_uuid
            WHERE r.usuario_id = :usuarioId AND r.fonte IN (:fontes)
                AND DATE(%s) = :dia
            ORDER BY r.tocada_em ASC
            LIMIT :limite",
            self::DATA_LOCAL,
            self::DATA_LOCAL,
        ), $parametros, $tipos);

        return array_map(fn (array $linha): array => [
            'nome' => (string) $linha['nome'],
            'artista' => (string) $linha['artista'],
            'musicaUuid' => (string) $linha['musica_uuid'],
            'tocadaEm' => (string) $linha['tocada_local'],
            'minutos' => $this->paraMinutos($linha['ms']),
            'fonte' => (string) $linha['fonte'],
        ], $linhas);
    }

    /**
     * @return array{aberturas: list<array{nome: string, artista: string, musicaUuid: string, dias: int}>, fechamentos: list<array{nome: string, artista: string, musicaUuid: string, dias: int}>}
     */
    public function listarExtremosDoDia(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro, int $limite = 10): array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro);

        $sql = sprintf(
            "WITH ordenadas AS (
                SELECT r.musica_uuid,
                    ROW_NUMBER() OVER (PARTITION BY DATE(%1\$s) ORDER BY r.tocada_em ASC) AS rn_asc,
                    ROW_NUMBER() OVER (PARTITION BY DATE(%1\$s) ORDER BY r.tocada_em DESC) AS rn_desc
                FROM reproducao_musical r
                WHERE r.usuario_id = :usuarioId%2\$s
            ), extremos AS (
                SELECT tipo, musica_uuid, COUNT(*) AS dias
                FROM (
                    SELECT 'abertura' AS tipo, musica_uuid FROM ordenadas WHERE rn_asc = 1
                    UNION ALL
                    SELECT 'fechamento', musica_uuid FROM ordenadas WHERE rn_desc = 1
                ) marcados
                GROUP BY tipo, musica_uuid
            )
            SELECT e.tipo, m.titulo AS nome,
                COALESCE((
                    SELECT ac.nome FROM musica_artista_catalogo mac
                    INNER JOIN artista_catalogo ac ON ac.uuid = mac.artista_uuid
                    WHERE mac.musica_uuid = e.musica_uuid
                    ORDER BY mac.posicao ASC LIMIT 1
                ), 'Desconhecido') AS artista,
                BIN_TO_UUID(e.musica_uuid) AS musica_uuid, e.dias
            FROM extremos e
            INNER JOIN musica_catalogo m ON m.uuid = e.musica_uuid
            ORDER BY e.tipo ASC, e.dias DESC",
            self::DATA_LOCAL,
            $filtros,
        );

        $aberturas = [];
        $fechamentos = [];
        foreach ($this->consultar($sql, $parametros, $tipos) as $linha) {
            $item = [
                'nome' => (string) $linha['nome'],
                'artista' => (string) $linha['artista'],
                'musicaUuid' => (string) $linha['musica_uuid'],
                'dias' => (int) $linha['dias'],
            ];
            if ('abertura' === $linha['tipo']) {
                $aberturas[] = $item;
            } else {
                $fechamentos[] = $item;
            }
        }

        return [
            'aberturas' => array_slice($aberturas, 0, $limite),
            'fechamentos' => array_slice($fechamentos, 0, $limite),
        ];
    }

    /**
     * @return list<array{data: string, album: string, artista: string, faixas: int, minutos: int, musicaUuid: ?string}>
     */
    public function listarAlbunsEmSequencia(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro, int $minimoFaixas = 5, int $limite = 20): array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro);

        $linhas = $this->consultar(sprintf(
            "SELECT DATE(%1\$s) AS dia, m.album, BIN_TO_UUID(r.musica_uuid) AS musica_uuid, r.tocada_em, r.ms_reproduzidos AS ms
            FROM reproducao_musical r
            INNER JOIN musica_catalogo m ON m.uuid = r.musica_uuid
            WHERE r.usuario_id = :usuarioId AND m.album IS NOT NULL AND m.album <> ''%2\$s
            ORDER BY r.tocada_em ASC",
            self::DATA_LOCAL,
            $filtros,
        ), $parametros, $tipos);

        $sequencias = [];
        $atual = null;
        foreach ($linhas as $linha) {
            $chave = $linha['dia'].'|'.$linha['album'];
            if (null === $atual || $atual['chave'] !== $chave) {
                if (null !== $atual) {
                    $sequencias[] = $atual;
                }
                $atual = [
                    'chave' => $chave,
                    'data' => (string) $linha['dia'],
                    'album' => (string) $linha['album'],
                    'faixas' => 0,
                    'ms' => 0,
                    'musicaUuid' => (string) $linha['musica_uuid'],
                ];
            }
            ++$atual['faixas'];
            $atual['ms'] += (int) $linha['ms'];
        }
        if (null !== $atual) {
            $sequencias[] = $atual;
        }

        $melhores = [];
        foreach ($sequencias as $sequencia) {
            if ($sequencia['faixas'] < $minimoFaixas || $sequencia['faixas'] <= ($melhores[$sequencia['chave']]['faixas'] ?? 0)) {
                continue;
            }
            $melhores[$sequencia['chave']] = [
                'data' => $sequencia['data'],
                'album' => $sequencia['album'],
                'faixas' => $sequencia['faixas'],
                'minutos' => $this->paraMinutos($sequencia['ms']),
                'musicaUuid' => $sequencia['musicaUuid'],
            ];
        }

        $resultados = array_values($melhores);
        usort($resultados, static fn (array $a, array $b): int => $b['faixas'] <=> $a['faixas'] ?: strcmp($b['data'], $a['data']));
        $resultados = array_slice($resultados, 0, $limite);
        $artistas = $this->mapearArtistaPrincipalPorMusica(array_column($resultados, 'musicaUuid'));

        return array_map(static fn (array $resultado): array => [
            'data' => $resultado['data'],
            'album' => $resultado['album'],
            'artista' => $artistas[$resultado['musicaUuid']] ?? self::ARTISTA_DESCONHECIDO,
            'faixas' => $resultado['faixas'],
            'minutos' => $resultado['minutos'],
            'musicaUuid' => $resultado['musicaUuid'],
        ], $resultados);
    }

    /**
     * @param list<string> $uuids
     *
     * @return array<string, string>
     */
    private function mapearArtistaPrincipalPorMusica(array $uuids): array
    {
        if ([] === $uuids) {
            return [];
        }

        $artistas = [];
        $linhas = $this->consultar(
            'SELECT BIN_TO_UUID(mac.musica_uuid) AS musica_uuid, ac.nome
            FROM musica_artista_catalogo mac
            INNER JOIN artista_catalogo ac ON ac.uuid = mac.artista_uuid
            WHERE mac.musica_uuid IN (:uuids)
            ORDER BY mac.posicao ASC',
            ['uuids' => array_map(static fn (string $uuid): string => Uuid::fromString($uuid)->toBinary(), array_values(array_unique($uuids)))],
            ['uuids' => ArrayParameterType::BINARY],
        );
        foreach ($linhas as $linha) {
            $artistas[(string) $linha['musica_uuid']] ??= (string) $linha['nome'];
        }

        return $artistas;
    }

    /**
     * @return array{sessoes: int, duracaoMediaMinutos: int, maratonaMinutos: int, maratonaInicio: ?string, maratonaFim: ?string, histograma: list<array{ateMinutos: ?int, sessoes: int}>, maratonaMusicas: list<string>, maratonaFaixas: int}
     */
    public function calcularSessoes(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro, int $gapMinutos = 10): array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro);

        $linhas = $this->consultar(sprintf(
            'SELECT UNIX_TIMESTAMP(r.tocada_em) AS ts, r.ms_reproduzidos AS ms, BIN_TO_UUID(r.musica_uuid) AS musica_uuid
            FROM reproducao_musical r
            WHERE r.usuario_id = :usuarioId%s
            ORDER BY r.tocada_em ASC',
            $filtros,
        ), $parametros, $tipos);

        $sessoes = $this->agruparSessoes($linhas, $gapMinutos * 60);
        $maratona = null;
        foreach ($sessoes as $sessao) {
            if (null === $maratona || $sessao['ms'] > $maratona['ms']) {
                $maratona = $sessao;
            }
        }

        $duracoes = array_column($sessoes, 'ms');
        $media = [] === $duracoes ? 0 : (int) round(array_sum($duracoes) / count($duracoes));

        return [
            'sessoes' => count($sessoes),
            'duracaoMediaMinutos' => $this->paraMinutos($media),
            'maratonaMinutos' => $this->paraMinutos($maratona['ms'] ?? 0),
            'maratonaInicio' => null === $maratona ? null : gmdate('c', $maratona['inicio']),
            'maratonaFim' => null === $maratona ? null : gmdate('c', $maratona['fim']),
            'histograma' => $this->montarHistogramaSessoes($duracoes),
            'maratonaMusicas' => null === $maratona ? [] : $this->listarMaisTocadasDaSessao($maratona['musicas']),
            'maratonaFaixas' => null === $maratona ? 0 : count($maratona['musicas']),
        ];
    }

    /**
     * @param list<array<string, mixed>> $linhas
     *
     * @return list<array{inicio: int, fim: int, ms: int, musicas: list<string>}>
     */
    private function agruparSessoes(array $linhas, int $gapSegundos): array
    {
        $sessoes = [];
        $atual = null;
        $ultimoTs = null;

        foreach ($linhas as $linha) {
            $ts = (int) $linha['ts'];
            $ms = (int) $linha['ms'];
            if (null === $ultimoTs || ($ts - $ultimoTs) > $gapSegundos) {
                if (null !== $atual) {
                    $sessoes[] = $atual;
                }
                $atual = ['inicio' => $ts, 'fim' => $ts, 'ms' => 0, 'musicas' => []];
            }
            $atual['fim'] = $ts + intdiv($ms, 1000);
            $atual['ms'] += $ms;
            $atual['musicas'][] = (string) $linha['musica_uuid'];
            $ultimoTs = $ts;
        }

        if (null !== $atual) {
            $sessoes[] = $atual;
        }

        return $sessoes;
    }

    /**
     * @param list<int> $duracoesMs
     *
     * @return list<array{ateMinutos: ?int, sessoes: int}>
     */
    private function montarHistogramaSessoes(array $duracoesMs): array
    {
        $faixas = array_map(static fn (int $limite): array => ['ateMinutos' => $limite, 'sessoes' => 0], self::FAIXAS_SESSAO_MINUTOS);
        $faixas[] = ['ateMinutos' => null, 'sessoes' => 0];

        foreach ($duracoesMs as $ms) {
            $minutos = $ms / self::MS_POR_MINUTO;
            $indice = count(self::FAIXAS_SESSAO_MINUTOS);
            foreach (self::FAIXAS_SESSAO_MINUTOS as $posicao => $limite) {
                if ($minutos < $limite) {
                    $indice = $posicao;
                    break;
                }
            }
            ++$faixas[$indice]['sessoes'];
        }

        return $faixas;
    }

    /**
     * @param list<string> $musicas
     *
     * @return list<string>
     */
    private function listarMaisTocadasDaSessao(array $musicas): array
    {
        $contagem = array_count_values($musicas);
        arsort($contagem);

        return array_slice(array_map('strval', array_keys($contagem)), 0, self::LIMITE_CAPAS_MARATONA);
    }

    /**
     * @param list<string> $uuids
     *
     * @return array<string, MusicaAnaliseSpotifyDTO>
     */
    public function mapearMusicasPorUuid(Usuario $usuario, FiltroFonteMusica $filtro, array $uuids): array
    {
        $binarios = $this->paraBinarios($uuids);
        if ([] === $binarios) {
            return [];
        }

        $linhas = $this->consultar(sprintf(
            'SELECT r.musica_uuid, SUM(r.ms_reproduzidos >= :corte) AS streams, SUM(r.ms_reproduzidos) AS ms, %s
            FROM reproducao_musical r
            WHERE r.usuario_id = :usuarioId AND r.fonte IN (:fontes) AND r.musica_uuid IN (:uuids)
            GROUP BY r.musica_uuid',
            self::COLUNAS_POR_FONTE,
        ), $this->parametrosUuids($usuario, $filtro, $binarios), $this->tiposUuids());

        $mapa = [];
        foreach ($this->complementarMusicas($usuario, $linhas) as $linha) {
            $musica = MusicaAnaliseSpotifyDTO::daLinha($linha);
            $mapa[(string) $musica->musicaUuid] = $musica;
        }

        return $mapa;
    }

    /**
     * @param list<string> $uuids
     *
     * @return array<string, ArtistaAnaliseSpotifyDTO>
     */
    public function mapearArtistasPorUuid(Usuario $usuario, FiltroFonteMusica $filtro, array $uuids): array
    {
        $binarios = $this->paraBinarios($uuids);
        if ([] === $binarios) {
            return [];
        }

        $linhas = $this->consultar(sprintf(
            '%s
            SELECT c.artista_uuid, SUM(r.ms_reproduzidos >= :corte) AS streams, SUM(r.ms_reproduzidos) AS ms, %s
            FROM reproducao_musical r
            INNER JOIN creditos c ON c.musica_uuid = r.musica_uuid
            WHERE r.usuario_id = :usuarioId AND r.fonte IN (:fontes) AND c.artista_uuid IN (:uuids)
            GROUP BY c.artista_uuid',
            self::CTE_CREDITOS,
            self::COLUNAS_POR_FONTE,
        ), $this->parametrosUuids($usuario, $filtro, $binarios), $this->tiposUuids());

        $mapa = [];
        foreach ($this->complementarArtistas($usuario, $linhas) as $linha) {
            $artista = ArtistaAnaliseSpotifyDTO::daLinha($linha);
            $mapa[(string) $artista->artistaUuid] = $artista;
        }

        return $mapa;
    }

    /**
     * @param list<string> $uuids
     *
     * @return array<string, list<string>>
     */
    public function listarArtistasDasMusicas(array $uuids): array
    {
        $binarios = $this->paraBinarios($uuids);
        if ([] === $binarios) {
            return [];
        }

        $linhas = $this->consultar(sprintf(
            '%s SELECT DISTINCT BIN_TO_UUID(c.musica_uuid) AS musica_uuid, BIN_TO_UUID(c.artista_uuid) AS artista_uuid FROM creditos c WHERE c.musica_uuid IN (:uuids)',
            self::CTE_CREDITOS,
        ), ['uuids' => $binarios], ['uuids' => ArrayParameterType::BINARY]);

        $mapa = [];
        foreach ($linhas as $linha) {
            $mapa[(string) $linha['musica_uuid']][] = (string) $linha['artista_uuid'];
        }

        return $mapa;
    }

    /**
     * @return list<array{faixa: string, artistaUuid: string, streams: int}>
     */
    public function listarTopArtistaPorFaixaDoDia(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro): array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro);

        $linhas = $this->consultar(sprintf(
            "%1\$s, por_faixa AS (
                SELECT CASE
                        WHEN HOUR(%2\$s) < 6 THEN 'madrugada'
                        WHEN HOUR(%2\$s) < 12 THEN 'manha'
                        WHEN HOUR(%2\$s) < 18 THEN 'tarde'
                        ELSE 'noite'
                    END AS faixa,
                    c.artista_uuid,
                    SUM(r.ms_reproduzidos >= :corte) AS streams,
                    SUM(r.ms_reproduzidos) AS ms
                FROM reproducao_musical r
                INNER JOIN creditos c ON c.musica_uuid = r.musica_uuid
                WHERE r.usuario_id = :usuarioId%3\$s
                GROUP BY faixa, c.artista_uuid
            )
            SELECT faixa, BIN_TO_UUID(artista_uuid) AS artista_uuid, streams
            FROM (
                SELECT faixa, artista_uuid, streams, ROW_NUMBER() OVER (PARTITION BY faixa ORDER BY streams DESC, ms DESC) AS posicao
                FROM por_faixa
            ) ranqueado
            WHERE posicao = 1",
            self::CTE_CREDITOS,
            self::DATA_LOCAL,
            $filtros,
        ), $parametros, $tipos);

        return array_map(static fn (array $linha): array => [
            'faixa' => (string) $linha['faixa'],
            'artistaUuid' => (string) $linha['artista_uuid'],
            'streams' => (int) $linha['streams'],
        ], $linhas);
    }

    /**
     * @return array<int, list<string>>
     */
    public function listarTopMusicasNesteDia(Usuario $usuario, FiltroFonteMusica $filtro, int $mes, int $dia, int $porAno): array
    {
        $parametros = [
            'usuarioId' => $usuario->getId(),
            'corte' => self::CORTE_STREAM_MS,
            'fontes' => $filtro->valoresFontes(),
            'mes' => $mes,
            'dia' => $dia,
            'porAno' => $porAno,
        ];
        $tipos = ['fontes' => ArrayParameterType::STRING, 'porAno' => ParameterType::INTEGER];

        $linhas = $this->consultar(sprintf(
            'SELECT ano, BIN_TO_UUID(musica_uuid) AS musica_uuid FROM (
                SELECT YEAR(%1$s) AS ano, r.musica_uuid,
                    ROW_NUMBER() OVER (
                        PARTITION BY YEAR(%1$s)
                        ORDER BY SUM(r.ms_reproduzidos >= :corte) DESC, SUM(r.ms_reproduzidos) DESC
                    ) AS posicao
                FROM reproducao_musical r
                WHERE r.usuario_id = :usuarioId AND r.fonte IN (:fontes)
                    AND MONTH(%1$s) = :mes AND DAY(%1$s) = :dia
                GROUP BY ano, r.musica_uuid
            ) ranqueado
            WHERE posicao <= :porAno
            ORDER BY ano DESC, posicao ASC',
            self::DATA_LOCAL,
        ), $parametros, $tipos);

        $mapa = [];
        foreach ($linhas as $linha) {
            $mapa[(int) $linha['ano']][] = (string) $linha['musica_uuid'];
        }

        return $mapa;
    }

    /**
     * @return list<array{musicaUuid: string, fonte: string, tocadaEm: string, tocadaEmUtc: string, minutos: int}>
     */
    public function listarUltimasReproducoes(Usuario $usuario, FiltroFonteMusica $filtro, int $limite, ?string $antesUtc = null): array
    {
        $parametros = ['usuarioId' => $usuario->getId(), 'fontes' => $filtro->valoresFontes(), 'limite' => $limite];
        $tipos = ['fontes' => ArrayParameterType::STRING, 'limite' => ParameterType::INTEGER];
        $filtroAntes = '';
        if (null !== $antesUtc) {
            $parametros['antes'] = $antesUtc;
            $filtroAntes = ' AND r.tocada_em < :antes';
        }

        $linhas = $this->consultar(sprintf(
            'SELECT BIN_TO_UUID(r.musica_uuid) AS musica_uuid, r.fonte, r.tocada_em, %s AS tocada_local, r.ms_reproduzidos AS ms
            FROM reproducao_musical r
            WHERE r.usuario_id = :usuarioId AND r.fonte IN (:fontes)%s
            ORDER BY r.tocada_em DESC
            LIMIT :limite',
            self::DATA_LOCAL,
            $filtroAntes,
        ), $parametros, $tipos);

        return array_map(fn (array $linha): array => [
            'musicaUuid' => (string) $linha['musica_uuid'],
            'fonte' => (string) $linha['fonte'],
            'tocadaEm' => (string) $linha['tocada_local'],
            'tocadaEmUtc' => (string) $linha['tocada_em'],
            'minutos' => $this->paraMinutos($linha['ms']),
        ], $linhas);
    }

    /**
     * @return list<MusicaAnaliseSpotifyDTO>
     */
    public function listarMusicasExclusivasDaFonte(Usuario $usuario, FonteReproducaoMusical $fonte, int $limite): array
    {
        $linhas = $this->consultar(sprintf(
            'SELECT r.musica_uuid, SUM(r.ms_reproduzidos >= :corte) AS streams, SUM(r.ms_reproduzidos) AS ms, %s
            FROM reproducao_musical r
            WHERE r.usuario_id = :usuarioId
            GROUP BY r.musica_uuid
            HAVING SUM(r.fonte <> :fonte) = 0 AND streams > 0
            ORDER BY %s
            LIMIT :limite',
            self::COLUNAS_POR_FONTE,
            self::ORDEM,
        ), [
            'usuarioId' => $usuario->getId(),
            'corte' => self::CORTE_STREAM_MS,
            'fonte' => $fonte->value,
            'limite' => $limite,
        ], ['limite' => ParameterType::INTEGER]);

        return array_map(MusicaAnaliseSpotifyDTO::daLinha(...), $this->complementarMusicas($usuario, $linhas));
    }

    /**
     * @return array{spotify: int, youtube_music: int, ambas: int}
     */
    public function contarMusicasPorExclusividade(Usuario $usuario): array
    {
        $linha = $this->consultarLinha(
            "SELECT COALESCE(SUM(sp > 0 AND yt = 0), 0) AS so_spotify,
                COALESCE(SUM(sp = 0 AND yt > 0), 0) AS so_youtube,
                COALESCE(SUM(sp > 0 AND yt > 0), 0) AS ambas
            FROM (
                SELECT SUM(r.fonte = 'spotify') AS sp, SUM(r.fonte = 'youtube_music') AS yt
                FROM reproducao_musical r
                WHERE r.usuario_id = :usuarioId
                GROUP BY r.musica_uuid
            ) por_musica",
            ['usuarioId' => $usuario->getId()],
            [],
        ) ?? [];

        return [
            'spotify' => (int) ($linha['so_spotify'] ?? 0),
            'youtube_music' => (int) ($linha['so_youtube'] ?? 0),
            'ambas' => (int) ($linha['ambas'] ?? 0),
        ];
    }

    /**
     * @return list<array{data: string, minutos: int, streams: int}>
     */
    public function listarMinutosPorDiaDoPeriodo(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro): array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro);

        $linhas = $this->consultar(sprintf(
            'SELECT DATE(%s) AS dia, SUM(r.ms_reproduzidos) AS ms, SUM(r.ms_reproduzidos >= :corte) AS streams
            FROM reproducao_musical r
            WHERE r.usuario_id = :usuarioId%s
            GROUP BY dia
            ORDER BY dia ASC',
            self::DATA_LOCAL,
            $filtros,
        ), $parametros, $tipos);

        return array_map(fn (array $linha): array => [
            'data' => (string) $linha['dia'],
            'minutos' => $this->paraMinutos($linha['ms']),
            'streams' => (int) $linha['streams'],
        ], $linhas);
    }

    /**
     * @return list<array{musicaUuid: string, tipo: string, titulo: string, urlCapa: ?string, streams: int, minutos: int}>
     */
    public function listarTopVersoesAlteradas(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro, int $limite): array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro);
        $parametros['limite'] = $limite;
        $tipos['limite'] = ParameterType::INTEGER;

        $linhas = $this->consultar(sprintf(
            "SELECT BIN_TO_UUID(r.musica_uuid) AS musica_uuid, v.tipo_versao AS tipo,
                MAX(v.titulo) AS titulo, MAX(v.url_capa) AS url_capa,
                SUM(r.ms_reproduzidos >= :corte) AS streams, SUM(r.ms_reproduzidos) AS ms
            FROM reproducao_musical r
            INNER JOIN reproducao_youtube ry ON r.fonte = 'youtube_music' AND ry.uuid = UUID_TO_BIN(r.origem_id)
            INNER JOIN video_youtube v ON v.uuid = ry.video_uuid
            WHERE r.usuario_id = :usuarioId AND v.tipo_versao IS NOT NULL AND v.tipo_versao <> 'original'%s
            GROUP BY r.musica_uuid, v.tipo_versao
            ORDER BY %s
            LIMIT :limite",
            $filtros,
            self::ORDEM,
        ), $parametros, $tipos);

        return array_map(fn (array $linha): array => [
            'musicaUuid' => (string) $linha['musica_uuid'],
            'tipo' => (string) $linha['tipo'],
            'titulo' => (string) $linha['titulo'],
            'urlCapa' => is_string($linha['url_capa']) ? $linha['url_capa'] : null,
            'streams' => (int) $linha['streams'],
            'minutos' => $this->paraMinutos($linha['ms']),
        ], $linhas);
    }

    /**
     * @param list<string> $uuids
     *
     * @return list<string>
     */
    private function paraBinarios(array $uuids): array
    {
        $validos = array_values(array_unique(array_filter($uuids, static fn (string $uuid): bool => Uuid::isValid($uuid))));

        return array_map(static fn (string $uuid): string => Uuid::fromString($uuid)->toBinary(), $validos);
    }

    /**
     * @param list<string> $binarios
     *
     * @return array<string, mixed>
     */
    private function parametrosUuids(Usuario $usuario, FiltroFonteMusica $filtro, array $binarios): array
    {
        return ['usuarioId' => $usuario->getId(), 'corte' => self::CORTE_STREAM_MS, 'fontes' => $filtro->valoresFontes(), 'uuids' => $binarios];
    }

    /**
     * @return array<string, mixed>
     */
    private function tiposUuids(): array
    {
        return ['fontes' => ArrayParameterType::STRING, 'uuids' => ArrayParameterType::BINARY];
    }

    /**
     * @return array{grupo: mixed, minutos: int}|null
     */
    private function buscarGrupoMaisOuvido(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro, string $expressao): ?array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro);

        $linha = $this->consultarLinha(sprintf(
            'SELECT %s AS grupo, SUM(r.ms_reproduzidos) AS ms
            FROM reproducao_musical r
            WHERE r.usuario_id = :usuarioId%s
            GROUP BY grupo
            ORDER BY ms DESC
            LIMIT 1',
            $expressao,
            $filtros,
        ), $parametros, $tipos);

        return null === $linha ? null : ['grupo' => $linha['grupo'], 'minutos' => $this->paraMinutos($linha['ms'])];
    }

    /**
     * @param list<array<string, mixed>> $linhas
     *
     * @return list<array<string, mixed>>
     */
    private function complementarMusicas(Usuario $usuario, array $linhas): array
    {
        $uuids = array_values(array_unique(array_map(static fn (array $linha): string => (string) $linha['musica_uuid'], $linhas)));
        if ([] === $uuids) {
            return [];
        }

        $parametros = ['usuarioId' => $usuario->getId(), 'uuids' => $uuids];
        $tipos = ['uuids' => ArrayParameterType::BINARY];
        $catalogo = [];
        foreach ($this->consultar('SELECT uuid, titulo, tipo, album, url_capa, video_oficial_id FROM musica_catalogo WHERE uuid IN (:uuids)', $parametros, $tipos) as $linha) {
            $catalogo[(string) $linha['uuid']] = $linha;
        }

        $artistas = [];
        $linhasArtistas = $this->consultar(
            'SELECT musica, nome FROM (
                SELECT mac.musica_uuid AS musica, COALESCE(au.nome, a.nome) AS nome, 0 AS grupo, 0 AS ordem_componente, mac.posicao AS ordem_artista
                FROM musica_artista_catalogo mac
                INNER JOIN artista_catalogo a ON a.uuid = mac.artista_uuid
                LEFT JOIN artista_catalogo au ON au.uuid = a.unido_a_uuid
                WHERE mac.musica_uuid IN (:uuids)
                UNION ALL
                SELECT cm.mashup_uuid, COALESCE(au.nome, a.nome), 1, cm.posicao, mac.posicao
                FROM componente_mashup cm
                INNER JOIN musica_artista_catalogo mac ON mac.musica_uuid = cm.musica_componente_uuid
                INNER JOIN artista_catalogo a ON a.uuid = mac.artista_uuid
                LEFT JOIN artista_catalogo au ON au.uuid = a.unido_a_uuid
                WHERE cm.mashup_uuid IN (:uuids)
            ) creditados
            ORDER BY musica, grupo, ordem_componente, ordem_artista',
            $parametros,
            $tipos,
        );
        foreach ($linhasArtistas as $linha) {
            $chave = (string) $linha['musica'];
            $artistas[$chave] ??= [];
            if (!in_array($linha['nome'], $artistas[$chave], true)) {
                $artistas[$chave][] = (string) $linha['nome'];
            }
        }

        $spotify = [];
        $linhasSpotify = $this->consultar(
            "SELECT r.musica_uuid, rs.codigo_faixa, MAX(rs.album) AS album, COUNT(*) AS qtd
            FROM reproducao_musical r
            INNER JOIN reproducao_spotify rs ON rs.uuid = UUID_TO_BIN(r.origem_id)
            WHERE r.usuario_id = :usuarioId AND r.fonte = 'spotify' AND r.musica_uuid IN (:uuids)
                AND rs.codigo_faixa IS NOT NULL AND rs.codigo_faixa <> ''
            GROUP BY r.musica_uuid, rs.codigo_faixa
            ORDER BY qtd DESC",
            $parametros,
            $tipos,
        );
        foreach ($linhasSpotify as $linha) {
            $spotify[(string) $linha['musica_uuid']] ??= $linha;
        }

        $youtube = [];
        $linhasYoutube = $this->consultar(
            "SELECT r.musica_uuid, v.video_id, MAX(v.url_capa) AS url_capa, COUNT(*) AS qtd
            FROM reproducao_musical r
            INNER JOIN reproducao_youtube ry ON ry.uuid = UUID_TO_BIN(r.origem_id)
            INNER JOIN video_youtube v ON v.uuid = ry.video_uuid
            WHERE r.usuario_id = :usuarioId AND r.fonte = 'youtube_music' AND r.musica_uuid IN (:uuids)
            GROUP BY r.musica_uuid, v.video_id
            ORDER BY qtd DESC",
            $parametros,
            $tipos,
        );
        foreach ($linhasYoutube as $linha) {
            $youtube[(string) $linha['musica_uuid']] ??= $linha;
        }

        return array_map(function (array $linha) use ($catalogo, $artistas, $spotify, $youtube): array {
            $chave = (string) $linha['musica_uuid'];
            $musica = $catalogo[$chave] ?? [];
            $nomesArtistas = $artistas[$chave] ?? [];
            $videoId = is_string($musica['video_oficial_id'] ?? null) ? $musica['video_oficial_id'] : ($youtube[$chave]['video_id'] ?? null);

            return [
                ...$this->prepararFontes($linha),
                'musica_uuid' => Uuid::fromBinary($chave)->toRfc4122(),
                'nome_faixa' => (string) ($musica['titulo'] ?? ''),
                'artista' => $nomesArtistas[0] ?? '',
                'artistas' => $nomesArtistas,
                'codigo_faixa' => $spotify[$chave]['codigo_faixa'] ?? null,
                'album' => $musica['album'] ?? $spotify[$chave]['album'] ?? null,
                'url_capa' => $musica['url_capa'] ?? $youtube[$chave]['url_capa'] ?? null,
                'mashup' => TipoMusicaCatalogo::Mashup->value === ($musica['tipo'] ?? null),
                'url_youtube_music' => null === $videoId ? null : sprintf(self::URL_YOUTUBE_MUSIC, $videoId),
            ];
        }, $linhas);
    }

    /**
     * @param list<array<string, mixed>> $linhas
     *
     * @return list<array<string, mixed>>
     */
    private function complementarArtistas(Usuario $usuario, array $linhas): array
    {
        $uuids = array_values(array_unique(array_map(static fn (array $linha): string => (string) $linha['artista_uuid'], $linhas)));
        if ([] === $uuids) {
            return [];
        }

        $artistas = [];
        foreach ($this->consultar('SELECT uuid, nome, url_foto FROM artista_catalogo WHERE uuid IN (:uuids)', ['uuids' => $uuids], ['uuids' => ArrayParameterType::BINARY]) as $linha) {
            $artistas[(string) $linha['uuid']] = $linha;
        }

        $codigos = $this->mapearCodigosSpotifyArtistas($usuario, array_map(static fn (array $artista): string => (string) $artista['nome'], $artistas));

        return array_map(function (array $linha) use ($artistas, $codigos): array {
            $chave = (string) $linha['artista_uuid'];
            $nome = (string) ($artistas[$chave]['nome'] ?? '');

            return [
                ...$this->prepararFontes($linha),
                'artista_uuid' => Uuid::fromBinary($chave)->toRfc4122(),
                'artista' => $nome,
                'codigo_artista' => $codigos[mb_strtolower(trim($nome))] ?? null,
                'url_foto' => $artistas[$chave]['url_foto'] ?? null,
            ];
        }, $linhas);
    }

    public function buscarCodigoSpotifyArtista(Usuario $usuario, string $nome): ?string
    {
        return $this->mapearCodigosSpotifyArtistas($usuario, [$nome])[mb_strtolower(trim($nome))] ?? null;
    }

    /**
     * @param array<array-key, string> $nomes
     *
     * @return array<string, string>
     */
    private function mapearCodigosSpotifyArtistas(Usuario $usuario, array $nomes): array
    {
        $chaves = array_values(array_unique(array_map(static fn (string $nome): string => mb_strtolower(trim($nome)), $nomes)));
        if ([] === $chaves) {
            return [];
        }

        $codigos = [];
        $consultas = [
            "SELECT LOWER(TRIM(nome_artista)) AS chave, MAX(codigo_artista) AS codigo FROM artista_faixa_spotify
                WHERE nome_artista IN (:nomes) AND codigo_artista IS NOT NULL AND codigo_artista <> '' GROUP BY chave",
            "SELECT LOWER(TRIM(artista_principal)) AS chave, MAX(codigo_artista_principal) AS codigo FROM reproducao_spotify
                WHERE usuario_id = :usuarioId AND artista_principal IN (:nomes) AND codigo_artista_principal IS NOT NULL AND codigo_artista_principal <> '' GROUP BY chave",
        ];
        foreach ($consultas as $sql) {
            foreach ($this->consultar($sql, ['usuarioId' => $usuario->getId(), 'nomes' => $chaves], ['nomes' => ArrayParameterType::STRING]) as $linha) {
                $codigos[(string) $linha['chave']] ??= (string) $linha['codigo'];
            }
        }

        return $codigos;
    }

    /**
     * @param array<string, mixed> $linha
     *
     * @return array<string, mixed>
     */
    private function prepararFontes(array $linha): array
    {
        if (!array_key_exists('qtd_spotify', $linha)) {
            return $linha;
        }

        $fontes = [];
        foreach (FonteReproducaoMusical::cases() as $fonte) {
            if ((int) $linha['qtd_'.$fonte->value] > 0) {
                $fontes[] = $fonte->value;
            }
        }

        return [
            ...$linha,
            'fontes' => $fontes,
            'por_fonte' => $this->dividirPorFonte($linha),
            'estimado' => (int) $linha['ms_estimado'] > 0,
        ];
    }

    /**
     * @param array<string, mixed> $parametros
     * @param array<string, mixed> $tipos
     *
     * @return array{0: string, 1: string, 2: string, 3: string}
     */
    private function agrupamentoAlvo(AlvoAnaliseMusicaDTO $alvo, array &$parametros, array &$tipos): array
    {
        if ($alvo->isMusica()) {
            $parametros['musicaAlvo'] = $alvo->musica?->toBinary();
            $tipos['musicaAlvo'] = ParameterType::BINARY;

            return ['WITH', '', 'r.musica_uuid', ':musicaAlvo'];
        }

        $parametros['artistaAlvo'] = $alvo->artista?->toBinary();
        $tipos['artistaAlvo'] = ParameterType::BINARY;

        return [self::CTE_CREDITOS.',', 'INNER JOIN creditos c ON c.musica_uuid = r.musica_uuid', 'c.artista_uuid', ':artistaAlvo'];
    }

    /**
     * @return array{0: array<string, mixed>, 1: array<string, mixed>, 2: string}
     */
    private function montarFiltros(
        Usuario $usuario,
        PeriodoAnaliseSpotifyDTO $periodo,
        FiltroFonteMusica $filtro,
        ?AlvoAnaliseMusicaDTO $alvo = null,
    ): array {
        $parametros = ['usuarioId' => $usuario->getId(), 'corte' => self::CORTE_STREAM_MS, 'fontes' => $filtro->valoresFontes()];
        $tipos = ['fontes' => ArrayParameterType::STRING];
        $filtros = ' AND r.fonte IN (:fontes)';

        if (!$periodo->isTodos()) {
            $parametros['inicioUtc'] = $periodo->inicioUtcSql();
            $parametros['fimUtc'] = $periodo->fimUtcSql();
            $filtros .= ' AND r.tocada_em >= :inicioUtc AND r.tocada_em < :fimUtc';
        }

        $filtros .= $this->filtroAlvo($alvo, $parametros, $tipos);

        return [$parametros, $tipos, $filtros];
    }

    /**
     * @return array{0: array<string, mixed>, 1: array<string, mixed>, 2: string}
     */
    private function montarFiltrosAte(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro): array
    {
        $parametros = [
            'usuarioId' => $usuario->getId(),
            'corte' => self::CORTE_STREAM_MS,
            'fontes' => $filtro->valoresFontes(),
            'inicioUtc' => $periodo->inicioUtcSql(),
            'fimUtc' => $periodo->fimUtcSql(),
        ];

        return [$parametros, ['fontes' => ArrayParameterType::STRING], ' AND r.fonte IN (:fontes) AND r.tocada_em < :fimUtc'];
    }

    /**
     * @param array<string, mixed> $parametros
     * @param array<string, mixed> $tipos
     */
    private function filtroAlvo(?AlvoAnaliseMusicaDTO $alvo, array &$parametros, array &$tipos): string
    {
        if (null === $alvo) {
            return '';
        }

        if ($alvo->isMusica()) {
            $parametros['musicaAlvo'] = $alvo->musica?->toBinary();
            $tipos['musicaAlvo'] = ParameterType::BINARY;

            return ' AND r.musica_uuid = :musicaAlvo';
        }

        $parametros['artistaAlvo'] = $alvo->artista?->toBinary();
        $tipos['artistaAlvo'] = ParameterType::BINARY;

        return sprintf(' AND r.musica_uuid IN (SELECT cr.musica_uuid FROM (%s) cr WHERE cr.artista_uuid = :artistaAlvo)', self::SELECT_CREDITOS);
    }

    /**
     * @param array<string, mixed> $linha
     *
     * @return array<string, array{streams: int, minutos: int}>
     */
    private function dividirPorFonte(array $linha): array
    {
        $divisao = [];
        foreach (FonteReproducaoMusical::cases() as $fonte) {
            $divisao[$fonte->value] = [
                'streams' => (int) ($linha['streams_'.$fonte->value] ?? 0),
                'minutos' => $this->paraMinutos($linha['ms_'.$fonte->value] ?? 0),
            ];
        }

        return $divisao;
    }

    private function montarUrlVariante(string $fonte, ?string $codigo): ?string
    {
        if (null === $codigo || '' === $codigo) {
            return null;
        }

        return FonteReproducaoMusical::YoutubeMusic->value === $fonte ? sprintf(self::URL_YOUTUBE_MUSIC, $codigo) : sprintf(self::URL_FAIXA_SPOTIFY, $codigo);
    }

    private function paraMinutos(mixed $ms): int
    {
        return (int) round(((int) $ms) / self::MS_POR_MINUTO);
    }

    /**
     * @return array{musicas: list<array{uuid: string, titulo: string, artistas: string, urlCapa: ?string, streams: int, minutos: int}>, artistas: list<array{uuid: string, nome: string, urlFoto: ?string, streams: int, minutos: int}>, totalMusicas: int, totalArtistas: int}
     */
    public function resumirMusicasDaImportacao(Usuario $usuario, Uuid $importacao, int $limite): array
    {
        $parametros = ['usuarioId' => $usuario->getId(), 'importacao' => $importacao->toBinary(), 'corte' => self::CORTE_STREAM_MS, 'limite' => $limite];
        $tipos = ['importacao' => ParameterType::BINARY, 'limite' => ParameterType::INTEGER];
        $daImportacao = "SELECT r.musica_uuid, r.ms_reproduzidos FROM reproducao_musical r
            INNER JOIN reproducao_youtube ry ON ry.uuid = UUID_TO_BIN(r.origem_id)
            WHERE r.usuario_id = :usuarioId AND r.fonte = 'youtube_music' AND r.musica_uuid IS NOT NULL AND ry.importacao_youtube_uuid = :importacao";

        $musicas = $this->consultar(
            "SELECT BIN_TO_UUID(m.uuid) AS uuid, m.titulo, m.url_capa,
                (SELECT GROUP_CONCAT(ac.nome ORDER BY ac.nome SEPARATOR ', ') FROM musica_artista_catalogo mac INNER JOIN artista_catalogo ac ON ac.uuid = mac.artista_uuid WHERE mac.musica_uuid = m.uuid) AS artistas,
                SUM(d.ms_reproduzidos >= :corte) AS streams, SUM(d.ms_reproduzidos) AS ms
            FROM ({$daImportacao}) d INNER JOIN musica_catalogo m ON m.uuid = d.musica_uuid
            GROUP BY m.uuid, m.titulo, m.url_capa
            ORDER BY streams DESC, ms DESC
            LIMIT :limite",
            $parametros,
            $tipos,
        );

        $artistas = $this->consultar(
            self::CTE_CREDITOS.", daimportacao AS ({$daImportacao})
            SELECT BIN_TO_UUID(a.uuid) AS uuid, a.nome, a.url_foto, SUM(d.ms_reproduzidos >= :corte) AS streams, SUM(d.ms_reproduzidos) AS ms
            FROM daimportacao d INNER JOIN creditos c ON c.musica_uuid = d.musica_uuid INNER JOIN artista_catalogo a ON a.uuid = c.artista_uuid
            GROUP BY a.uuid, a.nome, a.url_foto
            ORDER BY streams DESC, ms DESC
            LIMIT :limite",
            $parametros,
            $tipos,
        );

        $totais = $this->consultarLinha(
            self::CTE_CREDITOS.", daimportacao AS ({$daImportacao})
            SELECT (SELECT COUNT(DISTINCT d.musica_uuid) FROM daimportacao d) AS musicas,
                (SELECT COUNT(DISTINCT c.artista_uuid) FROM daimportacao d INNER JOIN creditos c ON c.musica_uuid = d.musica_uuid) AS artistas",
            $parametros,
            $tipos,
        );

        return [
            'musicas' => array_map(fn (array $linha): array => [
                'uuid' => (string) $linha['uuid'],
                'titulo' => (string) $linha['titulo'],
                'artistas' => (string) ($linha['artistas'] ?? ''),
                'urlCapa' => is_string($linha['url_capa']) ? $linha['url_capa'] : null,
                'streams' => (int) $linha['streams'],
                'minutos' => $this->paraMinutos($linha['ms']),
            ], $musicas),
            'artistas' => array_map(fn (array $linha): array => [
                'uuid' => (string) $linha['uuid'],
                'nome' => (string) $linha['nome'],
                'urlFoto' => is_string($linha['url_foto']) ? $linha['url_foto'] : null,
                'streams' => (int) $linha['streams'],
                'minutos' => $this->paraMinutos($linha['ms']),
            ], $artistas),
            'totalMusicas' => (int) ($totais['musicas'] ?? 0),
            'totalArtistas' => (int) ($totais['artistas'] ?? 0),
        ];
    }

    /**
     * @param array<string, mixed> $parametros
     * @param array<string, mixed> $tipos
     *
     * @return list<array<string, mixed>>
     */
    private function consultar(string $sql, array $parametros, array $tipos = []): array
    {
        [$usados, $tiposUsados] = $this->filtrarParametrosUsados($sql, $parametros, $tipos);

        /** @var list<array<string, mixed>> $linhas */
        $linhas = $this->getEntityManager()->getConnection()->fetchAllAssociative($sql, $usados, $tiposUsados);

        return $linhas;
    }

    /**
     * @param array<string, mixed> $parametros
     * @param array<string, mixed> $tipos
     *
     * @return array<string, mixed>|null
     */
    private function consultarLinha(string $sql, array $parametros, array $tipos = []): ?array
    {
        [$usados, $tiposUsados] = $this->filtrarParametrosUsados($sql, $parametros, $tipos);
        $linha = $this->getEntityManager()->getConnection()->fetchAssociative($sql, $usados, $tiposUsados);

        return false === $linha ? null : $linha;
    }

    /**
     * @param array<string, mixed> $parametros
     * @param array<string, mixed> $tipos
     *
     * @return array{0: array<string, mixed>, 1: array<string, mixed>}
     */
    private function filtrarParametrosUsados(string $sql, array $parametros, array $tipos): array
    {
        $usado = static fn (string $nome): bool => 1 === preg_match(sprintf('/:%s\\b/', preg_quote($nome, '/')), $sql);

        return [
            array_filter($parametros, $usado, ARRAY_FILTER_USE_KEY),
            array_filter($tipos, $usado, ARRAY_FILTER_USE_KEY),
        ];
    }
}
