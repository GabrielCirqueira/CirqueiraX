<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\MediaItem;
use App\Enum\OrigemMedia;
use App\Enum\StatusMediaItem;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<MediaItem>
 */
class MediaItemRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MediaItem::class);
    }

    public function salvar(MediaItem $mediaItem, bool $flush = true): void
    {
        $this->getEntityManager()->persist($mediaItem);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(MediaItem $mediaItem, bool $flush = true): void
    {
        $this->getEntityManager()->remove($mediaItem);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorHash(string $hash): ?MediaItem
    {
        return $this->findOneBy(['hash' => $hash]);
    }

    public function buscarPorUuid(Uuid|string $uuid): ?MediaItem
    {
        if (is_string($uuid)) {
            $uuid = Uuid::fromString($uuid);
        }

        return $this->find($uuid);
    }

    public function buscarDuplicado(
        string $hash,
        ?string $md5 = null,
        ?int $tamanhoBytes = null,
        ?string $urlOriginal = null,
        ?string $hashVisual = null,
    ): ?MediaItem {
        $porHash = $this->buscarPorHash($hash);
        if (null !== $porHash) {
            return $porHash;
        }

        if (null !== $md5 && '' !== trim($md5)) {
            $porMd5 = $this->buscarPorMd5($md5);
            if (null !== $porMd5) {
                return $porMd5;
            }
        }

        if (null !== $hashVisual && '' !== trim($hashVisual)) {
            $porVisual = $this->buscarPorHashVisual($hashVisual);
            if (null !== $porVisual) {
                return $porVisual;
            }
        }

        if (null !== $urlOriginal && '' !== trim($urlOriginal)) {
            $porUrl = $this->buscarPorUrlOriginal($urlOriginal);
            if (null !== $porUrl) {
                return $porUrl;
            }
        }

        return null;
    }

    public function buscarPorMd5(string $md5): ?MediaItem
    {
        $qb = $this->createQueryBuilder('m')
            ->where('m.metadata LIKE :md5')
            ->setParameter('md5', '%' . $md5 . '%')
            ->setMaxResults(1);

        /** @var MediaItem|null $item */
        $item = $qb->getQuery()->getOneOrNullResult();

        return $item;
    }

    public function buscarPorHashVisual(string $hashVisual): ?MediaItem
    {
        $qb = $this->createQueryBuilder('m')
            ->where('m.metadata LIKE :hashVisual')
            ->setParameter('hashVisual', '%' . $hashVisual . '%')
            ->setMaxResults(1);

        /** @var MediaItem|null $item */
        $item = $qb->getQuery()->getOneOrNullResult();

        return $item;
    }

    public function buscarPorUrlOriginal(string $urlOriginal): ?MediaItem
    {
        $qb = $this->createQueryBuilder('m')
            ->where('m.metadata LIKE :url')
            ->setParameter('url', '%' . $urlOriginal . '%')
            ->setMaxResults(1);

        /** @var MediaItem|null $item */
        $item = $qb->getQuery()->getOneOrNullResult();

        return $item;
    }

    public function buscarOutroItemComGoogleFotos(
        string $hash,
        ?Uuid $ignorarUuid = null,
        ?string $md5 = null,
        ?string $hashVisual = null,
    ): ?MediaItem {
        $qb = $this->createQueryBuilder('m')
            ->where('m.googlePhotosMediaId IS NOT NULL')
            ->andWhere("m.googlePhotosMediaId != ''");

        $orCondicoes = ['m.hash = :hash'];
        $qb->setParameter('hash', $hash);

        if (null !== $md5 && '' !== trim($md5)) {
            $orCondicoes[] = 'm.metadata LIKE :md5';
            $qb->setParameter('md5', '%' . $md5 . '%');
        }

        if (null !== $hashVisual && '' !== trim($hashVisual)) {
            $orCondicoes[] = 'm.metadata LIKE :hashVisual';
            $qb->setParameter('hashVisual', '%' . $hashVisual . '%');
        }

        $qb->andWhere('(' . implode(' OR ', $orCondicoes) . ')');

        if (null !== $ignorarUuid) {
            $qb->andWhere('m.uuid != :ignorarUuid')
                ->setParameter('ignorarUuid', $ignorarUuid->toBinary());
        }

        $qb->setMaxResults(1);

        /** @var MediaItem|null $item */
        $item = $qb->getQuery()->getOneOrNullResult();

        return $item;
    }

    /**
     * @return list<MediaItem>
     */
    public function buscarPorStatus(StatusMediaItem|string $status): array
    {
        $statusStr = is_string($status) ? $status : $status->value;

        return $this->findBy(['status' => $statusStr], ['criadoEm' => 'ASC']);
    }

    /**
     * @return array{itens: array<int, MediaItem>, total: int}
     */
    public function listarPaginado(int $pagina = 1, int $limite = 20): array
    {
        $offset = ($pagina - 1) * $limite;

        $qb = $this->createQueryBuilder('m')
            ->orderBy('m.criadoEm', 'DESC')
            ->setFirstResult($offset)
            ->setMaxResults($limite);

        /** @var array<int, MediaItem> $itens */
        $itens = $qb->getQuery()->getResult();

        $totalQb = $this->createQueryBuilder('m')
            ->select('COUNT(m.uuid)');

        $total = (int) $totalQb->getQuery()->getSingleScalarResult();

        return [
            'itens' => $itens,
            'total' => $total,
        ];
    }

    /**
     * @param array{
     *     status?: StatusMediaItem|string|null,
     *     origem?: OrigemMedia|string|null,
     *     categoriaId?: string|null,
     *     busca?: string|null,
     *     ordenacao?: string|null,
     *     direcao?: string|null
     * } $filtros
     *
     * @return array{itens: array<int, MediaItem>, total: int}
     */
    public function paginarComFiltros(array $filtros = [], int $pagina = 1, int $porPagina = 20): array
    {
        $qb = $this->createQueryBuilder('m');

        if (!empty($filtros['status'])) {
            $statusVal = $filtros['status'] instanceof StatusMediaItem ? $filtros['status']->value : $filtros['status'];
            $qb->andWhere('m.status = :status')
                ->setParameter('status', $statusVal);
        }

        if (!empty($filtros['tipo'])) {
            if ('video' === $filtros['tipo']) {
                $qb->andWhere("(m.origem IN ('download', 'bot_telegram') OR m.caminhoLocal LIKE '%.mp4' OR m.caminhoLocal LIKE '%.mkv' OR m.caminhoLocal LIKE '%.webm' OR m.caminhoLocal LIKE '%.mov' OR m.metadata LIKE '%video/%')");
            } elseif ('imagem' === $filtros['tipo'] || 'print' === $filtros['tipo'] || 'foto' === $filtros['tipo']) {
                $qb->andWhere("(m.origem IN ('print_pessoal', 'print_empresa') OR m.caminhoLocal LIKE '%.png' OR m.caminhoLocal LIKE '%.jpg' OR m.caminhoLocal LIKE '%.jpeg' OR m.caminhoLocal LIKE '%.webp' OR m.metadata LIKE '%image/%')");
            }
        }

        if (!empty($filtros['origem']) && 'todas' !== $filtros['origem'] && 'all' !== $filtros['origem']) {
            if (is_string($filtros['origem']) && str_contains($filtros['origem'], ',')) {
                $origens = array_map('trim', explode(',', $filtros['origem']));
                $qb->andWhere('m.origem IN (:origens)')
                    ->setParameter('origens', $origens);
            } elseif ('prints' === $filtros['origem']) {
                $qb->andWhere('m.origem IN (:origens_prints)')
                    ->setParameter('origens_prints', ['print_pessoal', 'print_empresa']);
            } elseif ('downloads' === $filtros['origem']) {
                $qb->andWhere('m.origem IN (:origens_downloads)')
                    ->setParameter('origens_downloads', ['download', 'bot_telegram']);
            } elseif ('manual' === $filtros['origem'] || 'upload_manual' === $filtros['origem']) {
                $qb->andWhere('m.origem = :origem_manual')
                    ->setParameter('origem_manual', 'manual');
            } else {
                $origemVal = $filtros['origem'] instanceof OrigemMedia ? $filtros['origem']->value : $filtros['origem'];
                $qb->andWhere('m.origem = :origem')
                    ->setParameter('origem', $origemVal);
            }
        }

        if (array_key_exists('categoriaId', $filtros) && null !== $filtros['categoriaId'] && '' !== $filtros['categoriaId']) {
            if ('null' === $filtros['categoriaId'] || 'sem_categoria' === $filtros['categoriaId']) {
                $qb->andWhere('m.categoriaId IS NULL');
            } else {
                $qb->andWhere('m.categoriaId = :categoriaId')
                    ->setParameter('categoriaId', $filtros['categoriaId']);
            }
        }

        if (!empty($filtros['busca'])) {
            $qb->andWhere('m.caminhoLocal LIKE :busca OR m.hash LIKE :busca OR m.metadata LIKE :busca')
                ->setParameter('busca', '%' . $filtros['busca'] . '%');
        }

        $totalQb = clone $qb;
        $total = (int) $totalQb->select('COUNT(m.uuid)')
            ->getQuery()
            ->getSingleScalarResult();

        $campoOrdenacao = match ($filtros['ordenacao'] ?? 'criadoEm') {
            'atualizadoEm' => 'm.atualizadoEm',
            'status' => 'm.status',
            'origem' => 'm.origem',
            default => 'm.criadoEm',
        };

        $direcao = 'ASC' === strtoupper($filtros['direcao'] ?? 'DESC') ? 'ASC' : 'DESC';

        $offset = max(0, ($pagina - 1) * $porPagina);

        $qb->orderBy($campoOrdenacao, $direcao)
            ->setFirstResult($offset)
            ->setMaxResults($porPagina);

        /** @var array<int, MediaItem> $itens */
        $itens = $qb->getQuery()->getResult();

        return [
            'itens' => $itens,
            'total' => $total,
        ];
    }

    /**
     * @return array<string, int>
     */
    public function contarAgrupadoPorStatus(): array
    {
        /** @var list<array{status: StatusMediaItem|string, total: int|string}> $resultados */
        $resultados = $this->createQueryBuilder('m')
            ->select('m.status as status, COUNT(m.uuid) as total')
            ->groupBy('m.status')
            ->getQuery()
            ->getArrayResult();

        $totais = [];
        foreach (StatusMediaItem::cases() as $case) {
            $totais[$case->value] = 0;
        }

        foreach ($resultados as $row) {
            if (isset($row['status'])) {
                $statusChave = $row['status'] instanceof StatusMediaItem ? $row['status']->value : (string) $row['status'];
                $totais[$statusChave] = (int) $row['total'];
            }
        }

        return $totais;
    }

    /**
     * @return array<string, int>
     */
    public function contarAgrupadoPorOrigem(): array
    {
        /** @var list<array{origem: OrigemMedia|string, total: int|string}> $resultados */
        $resultados = $this->createQueryBuilder('m')
            ->select('m.origem as origem, COUNT(m.uuid) as total')
            ->groupBy('m.origem')
            ->getQuery()
            ->getArrayResult();

        $totais = [];
        foreach (OrigemMedia::cases() as $case) {
            $totais[$case->value] = 0;
        }

        foreach ($resultados as $row) {
            if (isset($row['origem'])) {
                $origemChave = $row['origem'] instanceof OrigemMedia ? $row['origem']->value : (string) $row['origem'];
                $totais[$origemChave] = (int) $row['total'];
            }
        }

        return $totais;
    }

    public function obterTamanhoTotalBytes(): int
    {
        $conn = $this->getEntityManager()->getConnection();
        $sql = "SELECT COALESCE(SUM(COALESCE(
            CAST(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.tamanho_bytes')) AS UNSIGNED),
            CAST(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.filesize')) AS UNSIGNED),
            0
        )), 0) as total_bytes FROM media_item";

        $total = $conn->executeQuery($sql)->fetchOne();

        return (int) $total;
    }

    /**
     * @return array<string, array{totalItens: int, tamanhoBytes: int}>
     */
    public function obterEspacoAgrupadoPorOrigem(): array
    {
        $conn = $this->getEntityManager()->getConnection();
        $sql = "SELECT origem, COUNT(*) as total_itens, COALESCE(SUM(COALESCE(
            CAST(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.tamanho_bytes')) AS UNSIGNED),
            CAST(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.filesize')) AS UNSIGNED),
            0
        )), 0) as total_bytes FROM media_item GROUP BY origem";

        $linhas = $conn->executeQuery($sql)->fetchAllAssociative();

        $dados = [];
        foreach (OrigemMedia::cases() as $case) {
            $dados[$case->value] = [
                'totalItens' => 0,
                'tamanhoBytes' => 0,
            ];
        }

        foreach ($linhas as $linha) {
            $origem = (string) ($linha['origem'] ?? '');
            if (isset($dados[$origem])) {
                $dados[$origem] = [
                    'totalItens' => (int) ($linha['total_itens'] ?? 0),
                    'tamanhoBytes' => (int) ($linha['total_bytes'] ?? 0),
                ];
            }
        }

        return $dados;
    }

    /**
     * @return array<string|null, array{totalItens: int, tamanhoBytes: int}>
     */
    public function obterMetricasAgrupadasPorCategoria(): array
    {
        $conn = $this->getEntityManager()->getConnection();
        $sql = "SELECT categoria_id, COUNT(*) as total_itens, COALESCE(SUM(COALESCE(
            CAST(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.tamanho_bytes')) AS UNSIGNED),
            CAST(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.filesize')) AS UNSIGNED),
            0
        )), 0) as total_bytes FROM media_item GROUP BY categoria_id";

        $linhas = $conn->executeQuery($sql)->fetchAllAssociative();

        $dados = [];
        foreach ($linhas as $linha) {
            $catId = !empty($linha['categoria_id']) ? (string) $linha['categoria_id'] : null;
            $dados[$catId] = [
                'totalItens' => (int) ($linha['total_itens'] ?? 0),
                'tamanhoBytes' => (int) ($linha['total_bytes'] ?? 0),
            ];
        }

        return $dados;
    }

    /**
     * Busca vídeos no sistema (downloads/temporários) aptos para liberação de espaço,
     * garantindo estritamente que arquivos da pasta de sincronização com o celular (Syncthing /var/storage) NUNCA sejam selecionados.
     *
     * @return list<MediaItem>
     */
    public function buscarVideosParaLimpezaDoSistema(\DateTimeImmutable $dataLimite): array
    {
        $qb = $this->createQueryBuilder('m')
            ->where('m.criadoEm <= :dataLimite')
            ->andWhere('m.status NOT IN (:statusJaRemovidos)')
            ->andWhere("(m.origem IN ('download', 'bot_telegram') OR m.caminhoLocal LIKE '%.mp4' OR m.caminhoLocal LIKE '%.mkv' OR m.caminhoLocal LIKE '%.webm' OR m.caminhoLocal LIKE '%.mov' OR m.metadata LIKE '%video/%')")
            ->andWhere("m.origem NOT IN ('print_pessoal', 'print_empresa')")
            ->andWhere('m.caminhoLocal IS NOT NULL')
            // Proteção estrita: NUNCA apagar da pasta sincronizada com o celular (Syncthing /var/storage)
            ->andWhere("m.caminhoLocal NOT LIKE '%/var/storage/%'")
            ->andWhere("m.caminhoLocal NOT LIKE '%var/storage/%'")
            ->andWhere("m.caminhoLocal NOT LIKE '%sync_media/%'")
            ->setParameter('dataLimite', $dataLimite)
            ->setParameter('statusJaRemovidos', [
                StatusMediaItem::ARQUIVO_REMOVIDO->value,
                StatusMediaItem::ARQUIVO_EXPURGADO->value,
            ])
            ->orderBy('m.criadoEm', 'ASC');

        /** @var list<MediaItem> $itens */
        $itens = $qb->getQuery()->getResult();

        return $itens;
    }

    /**
     * @return list<MediaItem>
     */
    public function buscarVideosParaExpurgo(\DateTimeImmutable $dataLimite): array
    {
        return $this->buscarVideosParaLimpezaDoSistema($dataLimite);
    }

    /**
     * Retorna métricas analíticas sobre os vídeos baixados no sistema:
     * - Total de vídeos baixados no histórico (incluindo os removidos pela rotina/cron)
     * - Vídeos que permanecem com arquivo físico no sistema
     * - Vídeos removidos hoje pela rotina
     * - Total de vídeos com arquivo removido
     * - Espaço ocupado e espaço liberado em disco
     *
     * @return array{
     *     totalBaixados: int,
     *     totalRemovidos: int,
     *     permanecemSistema: int,
     *     removidosHoje: int,
     *     tamanhoPermanecemBytes: int,
     *     espacoLiberadoBytes: int
     * }
     */
    public function obterMetricasVideos(): array
    {
        $conn = $this->getEntityManager()->getConnection();
        $agoraSp = new \DateTimeImmutable('now', new \DateTimeZone('America/Sao_Paulo'));
        $hojePrefix = $agoraSp->format('Y-m-d') . '%';
        $inicioHojeUtc = (new \DateTimeImmutable('today', new \DateTimeZone('America/Sao_Paulo')))
            ->setTimezone(new \DateTimeZone('UTC'))
            ->format('Y-m-d H:i:s');

        $sql = "
            SELECT
                COUNT(*) as total_baixados,
                COALESCE(SUM(CASE WHEN status IN ('arquivo_removido', 'arquivo_expurgado') THEN 1 ELSE 0 END), 0) as total_removidos,
                COALESCE(SUM(CASE WHEN status NOT IN ('arquivo_removido', 'arquivo_expurgado') AND caminho_local IS NOT NULL THEN 1 ELSE 0 END), 0) as permanecem_sistema,
                COALESCE(SUM(CASE WHEN status IN ('arquivo_removido', 'arquivo_expurgado') AND (
                    JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.arquivo_removido_em')) LIKE :hojePrefix
                    OR JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.arquivo_expurgado_em')) LIKE :hojePrefix
                    OR atualizado_em >= :inicioHojeUtc
                ) THEN 1 ELSE 0 END), 0) as removidos_hoje,
                COALESCE(SUM(CASE WHEN status NOT IN ('arquivo_removido', 'arquivo_expurgado') AND caminho_local IS NOT NULL THEN
                    COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.tamanho_bytes')) AS UNSIGNED), CAST(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.filesize')) AS UNSIGNED), 0)
                ELSE 0 END), 0) as tamanho_permanecem_bytes,
                COALESCE(SUM(CASE WHEN status IN ('arquivo_removido', 'arquivo_expurgado') THEN
                    COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.tamanho_bytes')) AS UNSIGNED), CAST(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.filesize')) AS UNSIGNED), 0)
                ELSE 0 END), 0) as espaco_liberado_bytes
            FROM media_item
            WHERE (origem IN ('download', 'bot_telegram') OR caminho_local LIKE '%.mp4' OR caminho_local LIKE '%.mkv' OR caminho_local LIKE '%.webm' OR metadata LIKE '%video/%')
              AND origem NOT IN ('print_pessoal', 'print_empresa')
        ";

        /** @var array<string, mixed> $linha */
        $linha = $conn->executeQuery($sql, [
            'hojePrefix' => $hojePrefix,
            'inicioHojeUtc' => $inicioHojeUtc,
        ])->fetchAssociative() ?: [];

        return [
            'totalBaixados' => (int) ($linha['total_baixados'] ?? 0),
            'totalRemovidos' => (int) ($linha['total_removidos'] ?? 0),
            'permanecemSistema' => (int) ($linha['permanecem_sistema'] ?? 0),
            'removidosHoje' => (int) ($linha['removidos_hoje'] ?? 0),
            'tamanhoPermanecemBytes' => (int) ($linha['tamanho_permanecem_bytes'] ?? 0),
            'espacoLiberadoBytes' => (int) ($linha['espaco_liberado_bytes'] ?? 0),
        ];
    }
}
