<?php

declare(strict_types=1);

namespace App\Service\Importacao;

use App\Entity\MediaItem;
use App\Enum\OrigemMedia;
use App\Enum\StatusMediaItem;
use App\Repository\MediaItemRepository;
use App\Service\Dashboard\DashboardService;
use App\Support\MetadataKeys;
use Psr\Log\LoggerInterface;

final readonly class ImportarVideosFrankyService
{
    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private ?LoggerInterface $logger = null,
        private string $projectDir = '',
    ) {}

    /**
     * @return array{
     *     totalEncontradosDump: int,
     *     totalErrosIgnorados: int,
     *     totalDuplicadosDump: int,
     *     totalJaExistentesCirqueira: int,
     *     totalImportados: int,
     *     espacoTotalBytes: int,
     *     espacoTotalFormatado: string,
     *     dryRun: bool,
     *     erros: list<string>
     * }
     */
    public function importar(string $caminhoSql, bool $dryRun = false): array
    {
        $caminhoResolvido = $this->resolverCaminho($caminhoSql);

        if (!file_exists($caminhoResolvido) || !is_readable($caminhoResolvido)) {
            throw new \InvalidArgumentException(sprintf('Arquivo de backup SQL não encontrado ou inacessível: %s', $caminhoResolvido));
        }

        $this->logger?->info('Iniciando importação de vídeos do Franky', [
            'arquivo' => $caminhoResolvido,
            'dryRun' => $dryRun,
        ]);

        $linhasDump = $this->extrairLinhasVideoDownloads($caminhoResolvido);
        $totalEncontrados = count($linhasDump);

        $totalErrosIgnorados = 0;
        $totalDuplicadosDump = 0;
        $totalJaExistentes = 0;
        $totalImportados = 0;
        $espacoTotalBytes = 0;
        $erros = [];

        // Mapeamento por URL única de vídeos válidos do dump
        /** @var array<string, array{
         *     id: int,
         *     url: string,
         *     titulo: ?string,
         *     uploader: ?string,
         *     plataforma: ?string,
         *     duracao: ?string,
         *     thumbnailArquivo: ?string,
         *     arquivo: ?string,
         *     tamanhoBytes: int,
         *     status: string,
         *     erroMsg: ?string,
         *     jobId: ?string,
         *     dataMetadata: ?string,
         *     dataCopiado: ?string,
         *     criadoEm: string,
         *     atualizadoEm: string
         * }> $videosParaImportar */
        $videosParaImportar = [];

        foreach ($linhasDump as $row) {
            $status = (string) ($row['status'] ?? '');
            if ('erro' === $status) {
                $totalErrosIgnorados++;
                continue;
            }

            $url = trim((string) ($row['url'] ?? ''));
            if ('' === $url) {
                continue;
            }

            if (isset($videosParaImportar[$url])) {
                $totalDuplicadosDump++;
            }

            // Mantém a versão mais recente em caso de URL duplicada no dump
            $videosParaImportar[$url] = $row;
        }

        $batchCount = 0;

        foreach ($videosParaImportar as $url => $row) {
            try {
                // 1. Verifica se já existe no CirqueiraX por URL
                $existente = $this->mediaItemRepository->buscarPorUrlOriginal($url);
                if (null !== $existente) {
                    $totalJaExistentes++;
                    continue;
                }

                // 2. Gera hash determinístico SHA-256 para o item
                $hash = hash('sha256', 'franky:video_downloads:' . $url);

                $porHash = $this->mediaItemRepository->buscarPorHash($hash);
                if (null !== $porHash) {
                    $totalJaExistentes++;
                    continue;
                }

                $tamanhoBytes = max(0, (int) ($row['tamanhoBytes'] ?? 0));
                $espacoTotalBytes += $tamanhoBytes;

                $criadoEmStr = (string) ($row['criadoEm'] ?? 'now');
                $atualizadoEmStr = (string) ($row['atualizadoEm'] ?? ($row['dataCopiado'] ?? $criadoEmStr));
                $dataMetadataStr = !empty($row['dataMetadata']) ? (string) $row['dataMetadata'] : $criadoEmStr;
                $dataCopiadoStr = !empty($row['dataCopiado']) ? (string) $row['dataCopiado'] : $criadoEmStr;

                $criadoEm = $this->parseData($criadoEmStr);
                $atualizadoEm = $this->parseData($atualizadoEmStr);

                // 3. Constrói entidade MediaItem com status ARQUIVO_REMOVIDO e caminhoLocal nulo
                $item = new MediaItem(
                    hash: $hash,
                    origem: OrigemMedia::DOWNLOAD,
                    status: StatusMediaItem::ARQUIVO_REMOVIDO
                );

                $item->setCaminhoLocal(null);

                // 4. Monta metadados completos preservando dados originais
                $metadata = [
                    MetadataKeys::URL_ORIGINAL => $url,
                    'url' => $url,
                    'webpage_url' => $url,
                    MetadataKeys::TITULO => $row['titulo'] ?? null,
                    MetadataKeys::NOME_ORIGINAL => $row['arquivo'] ?? ($row['titulo'] ?? 'video.mp4'),
                    MetadataKeys::TAMANHO_BYTES => $tamanhoBytes,
                    'filesize' => $tamanhoBytes,
                    MetadataKeys::DATA => $dataMetadataStr,
                    MetadataKeys::DATA_CRIACAO_ARQUIVO => $dataCopiadoStr,
                    MetadataKeys::ARQUIVO_REMOVIDO_EM => $atualizadoEm->format(\DateTimeInterface::ATOM),
                    MetadataKeys::ARQUIVO_EXPURGADO_EM => $atualizadoEm->format(\DateTimeInterface::ATOM),
                    'duracao' => $row['duracao'] ?? null,
                    'uploader' => $row['uploader'] ?? null,
                    'plataforma' => $row['plataforma'] ?? null,
                    'importado_de' => 'franky',
                    'franky_id' => $row['id'] ?? null,
                    'franky_status_original' => $row['status'] ?? null,
                ];

                if (!empty($row['arquivo'])) {
                    $metadata[MetadataKeys::CAMINHO_LOCAL_ANTERIOR] = '/var/downloads/' . $row['arquivo'];
                }

                $item->setMetadata($metadata);
                $item->setCriadoEm($criadoEm);
                $item->setAtualizadoEm($atualizadoEm);

                // 5. Histórico de status
                $historico = [
                    [
                        'para' => StatusMediaItem::BAIXANDO->value,
                        'em' => $criadoEm->format(\DateTimeInterface::ATOM),
                    ],
                    [
                        'para' => StatusMediaItem::CONCLUIDO->value,
                        'em' => $this->parseData($dataCopiadoStr)->format(\DateTimeInterface::ATOM),
                    ],
                    [
                        'de' => StatusMediaItem::CONCLUIDO->value,
                        'para' => StatusMediaItem::ARQUIVO_REMOVIDO->value,
                        'em' => $atualizadoEm->format(\DateTimeInterface::ATOM),
                    ],
                ];
                $item->setHistoricoStatus($historico);

                if (!$dryRun) {
                    $this->mediaItemRepository->salvar($item, flush: false);
                    $batchCount++;

                    if ($batchCount >= 50) {
                        $this->mediaItemRepository->flush();
                        $batchCount = 0;
                    }
                }

                $totalImportados++;
            } catch (\Throwable $e) {
                $erroMsg = sprintf('Erro ao importar vídeo ID %s (%s): %s', $row['id'] ?? '?', $url, $e->getMessage());
                $erros[] = $erroMsg;
                $this->logger?->error($erroMsg);
            }
        }

        if (!$dryRun && $batchCount > 0) {
            $this->mediaItemRepository->flush();
        }

        $this->logger?->info('Importação de vídeos do Franky concluída', [
            'totalEncontrados' => $totalEncontrados,
            'totalImportados' => $totalImportados,
            'totalJaExistentes' => $totalJaExistentes,
            'totalErrosIgnorados' => $totalErrosIgnorados,
            'espacoTotalFormatado' => DashboardService::formatarBytes($espacoTotalBytes),
            'dryRun' => $dryRun,
        ]);

        return [
            'totalEncontradosDump' => $totalEncontrados,
            'totalErrosIgnorados' => $totalErrosIgnorados,
            'totalDuplicadosDump' => $totalDuplicadosDump,
            'totalJaExistentesCirqueira' => $totalJaExistentes,
            'totalImportados' => $totalImportados,
            'espacoTotalBytes' => $espacoTotalBytes,
            'espacoTotalFormatado' => DashboardService::formatarBytes($espacoTotalBytes),
            'dryRun' => $dryRun,
            'erros' => $erros,
        ];
    }

    /**
     * @return list<array{
     *     id: int,
     *     url: string,
     *     titulo: ?string,
     *     uploader: ?string,
     *     plataforma: ?string,
     *     duracao: ?string,
     *     thumbnailArquivo: ?string,
     *     arquivo: ?string,
     *     tamanhoBytes: int,
     *     status: string,
     *     erroMsg: ?string,
     *     jobId: ?string,
     *     dataMetadata: ?string,
     *     dataCopiado: ?string,
     *     criadoEm: string,
     *     atualizadoEm: string
     * }>
     */
    private function extrairLinhasVideoDownloads(string $caminhoSql): array
    {
        $handle = fopen($caminhoSql, 'r');
        if (false === $handle) {
            throw new \RuntimeException(sprintf('Não foi possível abrir o arquivo SQL: %s', $caminhoSql));
        }

        $buffer = '';
        $emInsert = false;

        while (!feof($handle)) {
            $linha = fgets($handle);
            if (false === $linha) {
                break;
            }

            if (str_contains($linha, 'INSERT INTO `video_downloads`')) {
                $emInsert = true;
                $buffer .= $linha;
            } elseif ($emInsert) {
                if (str_starts_with($linha, '/*!40000 ALTER TABLE') || str_starts_with($linha, 'UNLOCK TABLES;')) {
                    break;
                }
                $buffer .= $linha;
            }
        }

        fclose($handle);

        if ('' === $buffer) {
            return [];
        }

        return $this->parseInsertTuplas($buffer);
    }

    /**
     * @return list<array{
     *     id: int,
     *     url: string,
     *     titulo: ?string,
     *     uploader: ?string,
     *     plataforma: ?string,
     *     duracao: ?string,
     *     thumbnailArquivo: ?string,
     *     arquivo: ?string,
     *     tamanhoBytes: int,
     *     status: string,
     *     erroMsg: ?string,
     *     jobId: ?string,
     *     dataMetadata: ?string,
     *     dataCopiado: ?string,
     *     criadoEm: string,
     *     atualizadoEm: string
     * }>
     */
    private function parseInsertTuplas(string $sql): array
    {
        $rows = [];
        $partes = preg_split('/INSERT INTO `video_downloads` VALUES\s*/', $sql);
        if (false === $partes) {
            return [];
        }

        foreach ($partes as $parte) {
            $parte = trim($parte);
            if ('' === $parte) {
                continue;
            }
            if (str_ends_with($parte, ';')) {
                $parte = substr($parte, 0, -1);
            }

            $i = 0;
            $len = strlen($parte);

            while ($i < $len) {
                while ($i < $len && (ctype_space($parte[$i]) || ',' === $parte[$i])) {
                    $i++;
                }
                if ($i >= $len) {
                    break;
                }

                if ('(' === $parte[$i]) {
                    $i++;
                    $colunas = [];

                    while ($i < $len) {
                        while ($i < $len && ctype_space($parte[$i])) {
                            $i++;
                        }
                        if ($i < $len && ')' === $parte[$i]) {
                            $i++;
                            if (count($colunas) >= 16) {
                                $rows[] = [
                                    'id' => (int) $colunas[0],
                                    'url' => (string) $colunas[1],
                                    'titulo' => $colunas[2],
                                    'uploader' => $colunas[3],
                                    'plataforma' => $colunas[4],
                                    'duracao' => $colunas[5],
                                    'thumbnailArquivo' => $colunas[6],
                                    'arquivo' => $colunas[7],
                                    'tamanhoBytes' => (int) ($colunas[8] ?? 0),
                                    'status' => (string) ($colunas[9] ?? 'baixando'),
                                    'erroMsg' => $colunas[10],
                                    'jobId' => $colunas[11],
                                    'dataMetadata' => $colunas[12],
                                    'dataCopiado' => $colunas[13],
                                    'criadoEm' => (string) ($colunas[14] ?? 'now'),
                                    'atualizadoEm' => (string) ($colunas[15] ?? 'now'),
                                ];
                            }
                            break;
                        }

                        if ("'" === $parte[$i]) {
                            $i++;
                            $val = '';
                            while ($i < $len) {
                                if ('\\' === $parte[$i]) {
                                    if ($i + 1 < $len) {
                                        $val .= $parte[$i + 1];
                                        $i += 2;
                                    } else {
                                        $i++;
                                    }
                                } elseif ("'" === $parte[$i]) {
                                    if ($i + 1 < $len && "'" === $parte[$i + 1]) {
                                        $val .= "'";
                                        $i += 2;
                                    } else {
                                        $i++;
                                        break;
                                    }
                                } else {
                                    $val .= $parte[$i];
                                    $i++;
                                }
                            }
                            $colunas[] = $val;
                        } else {
                            $inicio = $i;
                            while ($i < $len && ',' !== $parte[$i] && ')' !== $parte[$i]) {
                                $i++;
                            }
                            $raw = trim(substr($parte, $inicio, $i - $inicio));
                            if ('NULL' === strtoupper($raw)) {
                                $colunas[] = null;
                            } elseif (is_numeric($raw)) {
                                $colunas[] = $raw;
                            } else {
                                $colunas[] = $raw;
                            }
                        }

                        while ($i < $len && ctype_space($parte[$i])) {
                            $i++;
                        }
                        if ($i < $len && ',' === $parte[$i]) {
                            $i++;
                        }
                    }
                } else {
                    $i++;
                }
            }
        }

        return $rows;
    }

    private function parseData(?string $dataStr): \DateTimeImmutable
    {
        if (null === $dataStr || '' === trim($dataStr)) {
            return new \DateTimeImmutable('now', new \DateTimeZone('America/Sao_Paulo'));
        }

        try {
            return new \DateTimeImmutable($dataStr, new \DateTimeZone('America/Sao_Paulo'));
        } catch (\Throwable) {
            return new \DateTimeImmutable('now', new \DateTimeZone('America/Sao_Paulo'));
        }
    }

    private function resolverCaminho(string $caminho): string
    {
        if (file_exists($caminho)) {
            return $caminho;
        }

        $baseDir = '' !== $this->projectDir ? $this->projectDir : '.';
        $caminhoRelativo = rtrim($baseDir, '/') . '/' . ltrim($caminho, '/');

        if (file_exists($caminhoRelativo)) {
            return $caminhoRelativo;
        }

        // Tenta dentro de var/imports
        $caminhoImports = rtrim($baseDir, '/') . '/var/imports/' . basename($caminho);
        if (file_exists($caminhoImports)) {
            return $caminhoImports;
        }

        return $caminho;
    }
}
