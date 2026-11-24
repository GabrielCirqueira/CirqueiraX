<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Usuario;
use App\Enum\OrigemMedia;
use App\Enum\StatusAudio;
use App\Enum\StatusLivroAudio;
use App\Enum\StatusMediaItem;
use App\Enum\StatusTranscricao;
use App\Support\MetadataKeys;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Usuario>
 */
final class ResumoAtividadeUsuarioRepository extends ServiceEntityRepository
{
    private const int MS_POR_MINUTO = 60000;
    private const int SEGUNDOS_POR_MINUTO = 60;

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Usuario::class);
    }

    /**
     * @return array<string, array{total: int, concluidos: int, erros: int, bytes: int, ultimo: ?string}>
     */
    public function resumirMidiasPorOrigem(Usuario $usuario): array
    {
        $linhas = $this->getEntityManager()->getConnection()->fetchAllAssociative(
            sprintf(
                "SELECT origem, COUNT(*) AS total,
                    SUM(status IN (:concluido, :local)) AS concluidos,
                    SUM(status = :erro) AS erros,
                    COALESCE(SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.%s')) AS UNSIGNED)), 0) AS bytes,
                    MAX(criado_em) AS ultimo
                FROM media_item
                WHERE usuario_id = :usuarioId
                GROUP BY origem",
                MetadataKeys::TAMANHO_BYTES,
            ),
            [
                'usuarioId' => $usuario->getId(),
                'concluido' => StatusMediaItem::CONCLUIDO->value,
                'local' => StatusMediaItem::DISTRIBUIDO_LOCAL->value,
                'erro' => StatusMediaItem::ERRO->value,
            ],
        );

        $resumo = [];
        foreach (OrigemMedia::cases() as $origem) {
            $resumo[$origem->value] = ['total' => 0, 'concluidos' => 0, 'erros' => 0, 'bytes' => 0, 'ultimo' => null];
        }
        foreach ($linhas as $linha) {
            $resumo[(string) $linha['origem']] = [
                'total' => (int) $linha['total'],
                'concluidos' => (int) $linha['concluidos'],
                'erros' => (int) $linha['erros'],
                'bytes' => (int) $linha['bytes'],
                'ultimo' => $this->textoOuNulo($linha['ultimo']),
            ];
        }

        return $resumo;
    }

    /**
     * @return array{total: int, disponiveis: int, erros: int, bytes: int, minutos: int, ultimo: ?string}
     */
    public function resumirAudios(Usuario $usuario): array
    {
        $linha = $this->getEntityManager()->getConnection()->fetchAssociative(
            'SELECT COUNT(*) AS total, COALESCE(SUM(status = :disponivel), 0) AS disponiveis, COALESCE(SUM(status = :erro), 0) AS erros,
                COALESCE(SUM(tamanho_bytes), 0) AS bytes, COALESCE(SUM(duracao_segundos), 0) AS segundos, MAX(criado_em) AS ultimo
            FROM audio
            WHERE usuario_id = :usuarioId',
            ['usuarioId' => $usuario->getId(), 'disponivel' => StatusAudio::DISPONIVEL->value, 'erro' => StatusAudio::ERRO->value],
        ) ?: [];

        return [
            'total' => (int) ($linha['total'] ?? 0),
            'disponiveis' => (int) ($linha['disponiveis'] ?? 0),
            'erros' => (int) ($linha['erros'] ?? 0),
            'bytes' => (int) ($linha['bytes'] ?? 0),
            'minutos' => intdiv((int) ($linha['segundos'] ?? 0), self::SEGUNDOS_POR_MINUTO),
            'ultimo' => $this->textoOuNulo($linha['ultimo'] ?? null),
        ];
    }

    /**
     * @return array{total: int, concluidas: int, erros: int, palavras: int, minutos: int, favoritas: int, deVideo: int, ultimo: ?string}
     */
    public function resumirTranscricoes(Usuario $usuario): array
    {
        $linha = $this->getEntityManager()->getConnection()->fetchAssociative(
            'SELECT COUNT(*) AS total, COALESCE(SUM(status = :concluida), 0) AS concluidas, COALESCE(SUM(status = :erro), 0) AS erros,
                COALESCE(SUM(total_palavras), 0) AS palavras, COALESCE(SUM(duracao_segundos), 0) AS segundos,
                COALESCE(SUM(favorita), 0) AS favoritas, COALESCE(SUM(origem_video), 0) AS de_video, MAX(criado_em) AS ultimo
            FROM transcricao
            WHERE usuario_id = :usuarioId',
            ['usuarioId' => $usuario->getId(), 'concluida' => StatusTranscricao::CONCLUIDA->value, 'erro' => StatusTranscricao::ERRO->value],
        ) ?: [];

        return [
            'total' => (int) ($linha['total'] ?? 0),
            'concluidas' => (int) ($linha['concluidas'] ?? 0),
            'erros' => (int) ($linha['erros'] ?? 0),
            'palavras' => (int) ($linha['palavras'] ?? 0),
            'minutos' => (int) round(((float) ($linha['segundos'] ?? 0)) / self::SEGUNDOS_POR_MINUTO),
            'favoritas' => (int) ($linha['favoritas'] ?? 0),
            'deVideo' => (int) ($linha['de_video'] ?? 0),
            'ultimo' => $this->textoOuNulo($linha['ultimo'] ?? null),
        ];
    }

    /**
     * @return array{total: int, prontos: int, paginas: int, ultimo: ?string}
     */
    public function resumirLivrosAudio(Usuario $usuario): array
    {
        $linha = $this->getEntityManager()->getConnection()->fetchAssociative(
            'SELECT COUNT(*) AS total, COALESCE(SUM(status = :pronto), 0) AS prontos, COALESCE(SUM(total_paginas), 0) AS paginas,
                MAX(criado_em) AS ultimo
            FROM livro_audio
            WHERE usuario_id = :usuarioId',
            ['usuarioId' => $usuario->getId(), 'pronto' => StatusLivroAudio::PRONTO->value],
        ) ?: [];

        return [
            'total' => (int) ($linha['total'] ?? 0),
            'prontos' => (int) ($linha['prontos'] ?? 0),
            'paginas' => (int) ($linha['paginas'] ?? 0),
            'ultimo' => $this->textoOuNulo($linha['ultimo'] ?? null),
        ];
    }

    /**
     * @return array{reproducoes: int, videos: int, minutos: int, ultimo: ?string}
     */
    public function resumirYoutube(Usuario $usuario): array
    {
        $linha = $this->getEntityManager()->getConnection()->fetchAssociative(
            'SELECT COUNT(*) AS reproducoes, COUNT(DISTINCT video_uuid) AS videos, COALESCE(SUM(ms_reproduzidos), 0) AS ms, MAX(tocada_em) AS ultimo
            FROM reproducao_youtube
            WHERE usuario_id = :usuarioId',
            ['usuarioId' => $usuario->getId()],
        ) ?: [];

        return [
            'reproducoes' => (int) ($linha['reproducoes'] ?? 0),
            'videos' => (int) ($linha['videos'] ?? 0),
            'minutos' => intdiv((int) ($linha['ms'] ?? 0), self::MS_POR_MINUTO),
            'ultimo' => $this->textoOuNulo($linha['ultimo'] ?? null),
        ];
    }

    /**
     * @return array{chamadas: int, tokens: int, custoMicrodolares: int}
     */
    public function resumirConsumoIa(Usuario $usuario): array
    {
        $linha = $this->getEntityManager()->getConnection()->fetchAssociative(
            'SELECT COUNT(*) AS chamadas, COALESCE(SUM(tokens_entrada + tokens_saida), 0) AS tokens, COALESCE(SUM(custo_microdolares), 0) AS custo
            FROM consumo_ia
            WHERE usuario_id = :usuarioId',
            ['usuarioId' => $usuario->getId()],
        ) ?: [];

        return [
            'chamadas' => (int) ($linha['chamadas'] ?? 0),
            'tokens' => (int) ($linha['tokens'] ?? 0),
            'custoMicrodolares' => (int) ($linha['custo'] ?? 0),
        ];
    }

    /**
     * @return array{total: int, faixasTransferidas: int}
     */
    public function resumirTransferencias(Usuario $usuario): array
    {
        $linha = $this->getEntityManager()->getConnection()->fetchAssociative(
            'SELECT COUNT(*) AS total, COALESCE(SUM(total_transferidas), 0) AS transferidas
            FROM transferencia_playlist
            WHERE usuario_id = :usuarioId',
            ['usuarioId' => $usuario->getId()],
        ) ?: [];

        return [
            'total' => (int) ($linha['total'] ?? 0),
            'faixasTransferidas' => (int) ($linha['transferidas'] ?? 0),
        ];
    }

    /**
     * @return array{spotify: ?string, youtubeMusic: ?string, googleFotos: bool}
     */
    public function resumirContasConectadas(Usuario $usuario): array
    {
        $conexao = $this->getEntityManager()->getConnection();
        $parametros = ['usuarioId' => $usuario->getId()];

        $spotify = $conexao->fetchOne('SELECT status FROM conta_spotify WHERE usuario_id = :usuarioId', $parametros);
        $youtubeMusic = $conexao->fetchOne('SELECT status FROM conta_youtube_music WHERE usuario_id = :usuarioId', $parametros);
        $googleFotos = $conexao->fetchOne('SELECT 1 FROM conta_google_fotos WHERE usuario_id = :usuarioId', $parametros);

        return [
            'spotify' => $this->textoOuNulo($spotify),
            'youtubeMusic' => $this->textoOuNulo($youtubeMusic),
            'googleFotos' => false !== $googleFotos,
        ];
    }

    private function textoOuNulo(mixed $valor): ?string
    {
        return is_string($valor) && '' !== $valor ? $valor : null;
    }
}
