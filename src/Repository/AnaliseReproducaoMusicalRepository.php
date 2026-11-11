<?php

declare(strict_types=1);

namespace App\Repository;

use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\Entity\ReproducaoMusical;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Enum\FonteReproducaoMusical;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\ArrayParameterType;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<ReproducaoMusical>
 */
final class AnaliseReproducaoMusicalRepository extends ServiceEntityRepository
{
    public const int CORTE_STREAM_MS = 30000;
    private const int MS_POR_MINUTO = 60000;
    private const string CTE_CREDITOS = 'WITH creditos (musica_uuid, artista_uuid) AS (
            SELECT mac.musica_uuid, COALESCE(ac.unido_a_uuid, ac.uuid)
            FROM musica_artista_catalogo mac INNER JOIN artista_catalogo ac ON ac.uuid = mac.artista_uuid
            WHERE ac.usuario_id = :usuarioId
            UNION
            SELECT cm.mashup_uuid, COALESCE(ac.unido_a_uuid, ac.uuid)
            FROM componente_mashup cm
            INNER JOIN musica_artista_catalogo mac ON mac.musica_uuid = cm.musica_componente_uuid
            INNER JOIN artista_catalogo ac ON ac.uuid = mac.artista_uuid
            WHERE ac.usuario_id = :usuarioId
        )';
    private const string COLUNAS_POR_FONTE = "SUM(CASE WHEN r.fonte = 'spotify' AND r.ms_reproduzidos >= :corte THEN 1 ELSE 0 END) AS streams_spotify,
            COALESCE(SUM(CASE WHEN r.fonte = 'spotify' THEN r.ms_reproduzidos END), 0) AS ms_spotify,
            SUM(CASE WHEN r.fonte = 'youtube_music' AND r.ms_reproduzidos >= :corte THEN 1 ELSE 0 END) AS streams_youtube_music,
            COALESCE(SUM(CASE WHEN r.fonte = 'youtube_music' THEN r.ms_reproduzidos END), 0) AS ms_youtube_music,
            COALESCE(SUM(CASE WHEN r.tempo_exato = 0 THEN r.ms_reproduzidos END), 0) AS ms_estimado";

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ReproducaoMusical::class);
    }

    /**
     * @return array{minutos: int, streams: int, reproducoes: int, artistas: int, musicas: int, dias: int, primeira: ?string, ultima: ?string, porFonte: array<string, array{streams: int, minutos: int}>, minutosEstimados: int}
     */
    public function calcularTotais(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro): array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro);
        $conexao = $this->getEntityManager()->getConnection();

        $linha = $conexao->fetchAssociative(
            sprintf(
                'SELECT COALESCE(SUM(r.ms_reproduzidos), 0) AS ms, COALESCE(SUM(r.ms_reproduzidos >= :corte), 0) AS streams, COUNT(*) AS reproducoes,
                    COUNT(DISTINCT r.musica_uuid) AS musicas, COUNT(DISTINCT DATE(%s)) AS dias, MIN(r.tocada_em) AS primeira, MAX(r.tocada_em) AS ultima, %s
                FROM reproducao_musical r
                WHERE r.usuario_id = :usuarioId%s',
                $periodo->expressaoData(),
                self::COLUNAS_POR_FONTE,
                $filtros,
            ),
            $parametros,
            $tipos,
        ) ?: [];
        $artistas = (int) $conexao->fetchOne(
            sprintf(
                '%s SELECT COUNT(DISTINCT c.artista_uuid) FROM reproducao_musical r INNER JOIN creditos c ON c.musica_uuid = r.musica_uuid WHERE r.usuario_id = :usuarioId%s',
                self::CTE_CREDITOS,
                $filtros,
            ),
            $parametros,
            $tipos,
        );

        return [
            'minutos' => $this->paraMinutos($linha['ms'] ?? 0),
            'streams' => (int) ($linha['streams'] ?? 0),
            'reproducoes' => (int) ($linha['reproducoes'] ?? 0),
            'artistas' => $artistas,
            'musicas' => (int) ($linha['musicas'] ?? 0),
            'dias' => (int) ($linha['dias'] ?? 0),
            'primeira' => is_string($linha['primeira'] ?? null) ? $linha['primeira'] : null,
            'ultima' => is_string($linha['ultima'] ?? null) ? $linha['ultima'] : null,
            'porFonte' => $this->dividirPorFonte($linha),
            'minutosEstimados' => $this->paraMinutos($linha['ms_estimado'] ?? 0),
        ];
    }

    /**
     * @return list<array{musicaUuid: string, titulo: string, tipo: string, urlCapa: ?string, streams: int, minutos: int, porFonte: array<string, array{streams: int, minutos: int}>, estimado: bool}>
     */
    public function listarRankingMusicas(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro, int $limite): array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro);

        $linhas = $this->getEntityManager()->getConnection()->fetchAllAssociative(
            sprintf(
                'SELECT r.musica_uuid, MAX(m.titulo) AS titulo, MAX(m.tipo) AS tipo, MAX(m.url_capa) AS url_capa,
                    SUM(r.ms_reproduzidos >= :corte) AS streams, SUM(r.ms_reproduzidos) AS ms, %s
                FROM reproducao_musical r
                INNER JOIN musica_catalogo m ON m.uuid = r.musica_uuid
                WHERE r.usuario_id = :usuarioId%s
                GROUP BY r.musica_uuid
                HAVING streams > 0
                ORDER BY streams DESC, ms DESC
                LIMIT %d',
                self::COLUNAS_POR_FONTE,
                $filtros,
                $limite,
            ),
            $parametros,
            $tipos,
        );

        return array_map(fn (array $linha): array => [
            'musicaUuid' => Uuid::fromBinary((string) $linha['musica_uuid'])->toRfc4122(),
            'titulo' => (string) $linha['titulo'],
            'tipo' => (string) $linha['tipo'],
            'urlCapa' => null === $linha['url_capa'] ? null : (string) $linha['url_capa'],
            'streams' => (int) $linha['streams'],
            'minutos' => $this->paraMinutos($linha['ms']),
            'porFonte' => $this->dividirPorFonte($linha),
            'estimado' => (int) $linha['ms_estimado'] > 0,
        ], $linhas);
    }

    /**
     * @return list<array{artistaUuid: string, nome: string, urlFoto: ?string, streams: int, minutos: int, porFonte: array<string, array{streams: int, minutos: int}>, estimado: bool}>
     */
    public function listarRankingArtistas(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro, int $limite): array
    {
        [$parametros, $tipos, $filtros] = $this->montarFiltros($usuario, $periodo, $filtro);

        $linhas = $this->getEntityManager()->getConnection()->fetchAllAssociative(
            sprintf(
                '%s
                SELECT c.artista_uuid, MAX(a.nome) AS nome, MAX(a.url_foto) AS url_foto,
                    SUM(r.ms_reproduzidos >= :corte) AS streams, SUM(r.ms_reproduzidos) AS ms, %s
                FROM reproducao_musical r
                INNER JOIN creditos c ON c.musica_uuid = r.musica_uuid
                INNER JOIN artista_catalogo a ON a.uuid = c.artista_uuid
                WHERE r.usuario_id = :usuarioId%s
                GROUP BY c.artista_uuid
                HAVING streams > 0
                ORDER BY streams DESC, ms DESC
                LIMIT %d',
                self::CTE_CREDITOS,
                self::COLUNAS_POR_FONTE,
                $filtros,
                $limite,
            ),
            $parametros,
            $tipos,
        );

        return array_map(fn (array $linha): array => [
            'artistaUuid' => Uuid::fromBinary((string) $linha['artista_uuid'])->toRfc4122(),
            'nome' => (string) $linha['nome'],
            'urlFoto' => null === $linha['url_foto'] ? null : (string) $linha['url_foto'],
            'streams' => (int) $linha['streams'],
            'minutos' => $this->paraMinutos($linha['ms']),
            'porFonte' => $this->dividirPorFonte($linha),
            'estimado' => (int) $linha['ms_estimado'] > 0,
        ], $linhas);
    }

    /**
     * @return array{0: array<string, mixed>, 1: array<string, int>, 2: string}
     */
    private function montarFiltros(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo, FiltroFonteMusica $filtro): array
    {
        $parametros = ['usuarioId' => $usuario->getId(), 'corte' => self::CORTE_STREAM_MS, 'fontes' => $filtro->valoresFontes()];
        $tipos = ['fontes' => ArrayParameterType::STRING];
        $filtros = ' AND r.fonte IN (:fontes)';

        if (!$periodo->isTodos()) {
            $parametros['inicioUtc'] = $periodo->inicioUtcSql();
            $parametros['fimUtc'] = $periodo->fimUtcSql();
            $filtros .= ' AND r.tocada_em >= :inicioUtc AND r.tocada_em < :fimUtc';
        }

        return [$parametros, $tipos, $filtros];
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

    private function paraMinutos(mixed $ms): int
    {
        return (int) round(((int) $ms) / self::MS_POR_MINUTO);
    }
}
