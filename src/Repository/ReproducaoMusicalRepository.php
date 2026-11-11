<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ReproducaoMusical;
use App\Entity\Usuario;
use App\Enum\FonteReproducaoMusical;
use App\Enum\StatusClassificacaoVideo;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\ArrayParameterType;
use Doctrine\DBAL\ParameterType;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ReproducaoMusical>
 */
final class ReproducaoMusicalRepository extends ServiceEntityRepository
{
    private const string CTE_MUSICA_EFETIVA = 'WITH RECURSIVE efetiva (uuid, raiz) AS (
            SELECT mc.uuid, mc.uuid FROM musica_catalogo mc WHERE mc.usuario_id = :usuarioId AND mc.unida_a_uuid IS NULL
            UNION ALL
            SELECT mf.uuid, e.raiz FROM musica_catalogo mf INNER JOIN efetiva e ON mf.unida_a_uuid = e.uuid
        )';

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ReproducaoMusical::class);
    }

    /**
     * @param list<array{origem: string, musica: string}> $vinculos
     */
    public function gravarSpotify(Usuario $usuario, array $vinculos): int
    {
        if ([] === $vinculos) {
            return 0;
        }

        $linhas = [];
        $parametros = ['usuarioId' => $usuario->getId(), 'fonte' => FonteReproducaoMusical::Spotify->value];
        $tipos = [];
        foreach ($vinculos as $indice => $vinculo) {
            $linhas[] = sprintf('ROW(:o%1$d, :m%1$d)', $indice);
            $parametros['o'.$indice] = $vinculo['origem'];
            $parametros['m'.$indice] = $vinculo['musica'];
            $tipos['o'.$indice] = ParameterType::BINARY;
            $tipos['m'.$indice] = ParameterType::BINARY;
        }

        return (int) $this->getEntityManager()->getConnection()->executeStatement(
            sprintf(
                'INSERT INTO reproducao_musical (usuario_id, musica_uuid, musica_origem_uuid, fonte, tocada_em, ms_reproduzidos, tempo_exato, pulada, aleatorio, origem_id, criado_em)
                %s
                SELECT r.usuario_id, e.raiz, v.musica, :fonte, r.tocada_em, r.ms_reproduzidos, 1, r.pulada, r.aleatorio, BIN_TO_UUID(r.uuid), UTC_TIMESTAMP()
                FROM (VALUES %s) AS v (origem, musica)
                INNER JOIN reproducao_spotify r ON r.uuid = v.origem
                INNER JOIN efetiva e ON e.uuid = v.musica
                WHERE r.usuario_id = :usuarioId
                ON DUPLICATE KEY UPDATE musica_uuid = VALUES(musica_uuid), musica_origem_uuid = VALUES(musica_origem_uuid), tocada_em = VALUES(tocada_em),
                    ms_reproduzidos = VALUES(ms_reproduzidos), pulada = VALUES(pulada), aleatorio = VALUES(aleatorio)',
                self::CTE_MUSICA_EFETIVA,
                implode(', ', $linhas),
            ),
            $parametros,
            $tipos,
        );
    }

    public function removerOrfasSpotify(Usuario $usuario): int
    {
        return (int) $this->getEntityManager()->getConnection()->executeStatement(
            'DELETE rm FROM reproducao_musical rm
            LEFT JOIN reproducao_spotify r ON r.uuid = UUID_TO_BIN(rm.origem_id)
            WHERE rm.usuario_id = :usuarioId AND rm.fonte = :fonte AND r.uuid IS NULL',
            ['usuarioId' => $usuario->getId(), 'fonte' => FonteReproducaoMusical::Spotify->value],
        );
    }

    /**
     * @param list<string>|null $videoUuidsBinarios
     */
    public function reprojetarYoutube(Usuario $usuario, ?array $videoUuidsBinarios): int
    {
        if ([] === $videoUuidsBinarios) {
            return 0;
        }

        $conexao = $this->getEntityManager()->getConnection();
        $parametros = [
            'usuarioId' => $usuario->getId(),
            'fonte' => FonteReproducaoMusical::YoutubeMusic->value,
            'status' => [StatusClassificacaoVideo::Musica->value, StatusClassificacaoVideo::Mashup->value],
        ];
        $tipos = ['status' => ArrayParameterType::STRING];
        $filtroVideosRemocao = '';
        $filtroVideosInsercao = '';

        if (null !== $videoUuidsBinarios) {
            $parametros['videos'] = $videoUuidsBinarios;
            $tipos['videos'] = ArrayParameterType::BINARY;
            $filtroVideosRemocao = ' AND ry.video_uuid IN (:videos)';
            $filtroVideosInsercao = ' AND v.uuid IN (:videos)';
        }

        $remocao = null === $videoUuidsBinarios
            ? 'DELETE FROM reproducao_musical WHERE usuario_id = :usuarioId AND fonte = :fonte'
            : sprintf(
                'DELETE rm FROM reproducao_musical rm
                INNER JOIN reproducao_youtube ry ON ry.uuid = UUID_TO_BIN(rm.origem_id)
                WHERE rm.usuario_id = :usuarioId AND rm.fonte = :fonte%s',
                $filtroVideosRemocao,
            );
        $conexao->executeStatement($remocao, array_diff_key($parametros, ['status' => true]), array_diff_key($tipos, ['status' => true]));

        return (int) $conexao->executeStatement(
            sprintf(
                'INSERT INTO reproducao_musical (usuario_id, musica_uuid, musica_origem_uuid, fonte, tocada_em, ms_reproduzidos, tempo_exato, pulada, aleatorio, origem_id, criado_em)
                %s
                SELECT r.usuario_id, e.raiz, v.musica_catalogo_uuid, :fonte, r.tocada_em, r.ms_reproduzidos, r.tempo_exato, NULL, NULL, BIN_TO_UUID(r.uuid), UTC_TIMESTAMP()
                FROM reproducao_youtube r
                INNER JOIN video_youtube v ON v.uuid = r.video_uuid
                INNER JOIN efetiva e ON e.uuid = v.musica_catalogo_uuid
                WHERE r.usuario_id = :usuarioId AND v.status IN (:status)%s',
                self::CTE_MUSICA_EFETIVA,
                $filtroVideosInsercao,
            ),
            $parametros,
            $tipos,
        );
    }

    public function atualizarMusicasEfetivas(Usuario $usuario): int
    {
        return (int) $this->getEntityManager()->getConnection()->executeStatement(
            sprintf(
                '%s
                UPDATE reproducao_musical rm
                INNER JOIN efetiva e ON e.uuid = rm.musica_origem_uuid
                SET rm.musica_uuid = e.raiz
                WHERE rm.usuario_id = :usuarioId AND rm.musica_uuid <> e.raiz',
                self::CTE_MUSICA_EFETIVA,
            ),
            ['usuarioId' => $usuario->getId()],
        );
    }

    public function contarDoUsuario(Usuario $usuario, FonteReproducaoMusical $fonte): int
    {
        return (int) $this->getEntityManager()->getConnection()->fetchOne(
            'SELECT COUNT(*) FROM reproducao_musical WHERE usuario_id = :usuarioId AND fonte = :fonte',
            ['usuarioId' => $usuario->getId(), 'fonte' => $fonte->value],
        );
    }

    public function limparMemoria(): void
    {
        $this->getEntityManager()->clear();
    }
}
