<?php

declare(strict_types=1);

namespace App\Service\MediaItem;

use App\Entity\MediaItem;
use App\Enum\StatusMediaItem;
use App\Interface\ArmazenamentoInterface;
use App\Repository\MediaItemRepository;
use App\Support\MetadataKeys;
use Psr\Log\LoggerInterface;

final readonly class LimparVideosAntigosService
{
    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private ArmazenamentoInterface $armazenamentoClient,
        private ?LoggerInterface $logger = null,
        private string $projectDir = '',
    ) {}

    /**
     * @return array{
     *     totalAnalisados: int,
     *     totalRemovidos: int,
     *     espacoLiberadoBytes: int,
     *     espacoLiberadoFormatado: string,
     *     erros: list<string>
     * }
     */
    public function executar(int $dias = 7, bool $dryRun = false): array
    {
        $dataLimite = (new \DateTimeImmutable())->modify(sprintf('-%d days', $dias));
        $videos = $this->mediaItemRepository->buscarVideosParaLimpezaDoSistema($dataLimite);

        $totalAnalisados = count($videos);
        $totalRemovidos = 0;
        $espacoLiberadoBytes = 0;
        $erros = [];

        foreach ($videos as $item) {
            try {
                // Validação estrita 1: somente vídeos, NUNCA imagens ou prints
                if (!$item->isVideo() || $item->isPrint()) {
                    continue;
                }

                $caminhoLocal = $item->caminhoLocal();

                // Validação estrita 2: NUNCA apagar da pasta de sincronização do Syncthing (celular/VPS)
                if ($this->isPastaSincronizadaComCelular($caminhoLocal)) {
                    $this->logger?->info('Vídeo está na pasta de sincronização com o celular (Syncthing). Preservando arquivo intacto no disco.', [
                        'uuid' => $item->uuid()?->toString(),
                        'caminho' => $caminhoLocal,
                    ]);
                    continue;
                }

                $tamanhoArquivo = 0;

                if (null !== $caminhoLocal && '' !== trim($caminhoLocal) && file_exists($caminhoLocal)) {
                    $tamanhoArquivo = (int) @filesize($caminhoLocal);

                    // Garante que a miniatura local em cache exista antes de apagar o arquivo de vídeo do sistema
                    $this->garantirThumbnailCache($item, $caminhoLocal);

                    if (!$dryRun) {
                        $this->armazenamentoClient->remover($caminhoLocal);
                    }
                    $espacoLiberadoBytes += $tamanhoArquivo;
                }

                if (!$dryRun) {
                    $metadata = $item->metadata();
                    if (null !== $caminhoLocal && '' !== trim($caminhoLocal)) {
                        $metadata[MetadataKeys::CAMINHO_LOCAL_ANTERIOR] = $caminhoLocal;
                    }
                    $agora = (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM);
                    $metadata[MetadataKeys::ARQUIVO_REMOVIDO_EM] = $agora;
                    $metadata[MetadataKeys::ARQUIVO_EXPURGADO_EM] = $agora;

                    // Preserva o tamanho nos metadados para fins estatísticos
                    if ($tamanhoArquivo > 0 && !isset($metadata[MetadataKeys::TAMANHO_BYTES])) {
                        $metadata[MetadataKeys::TAMANHO_BYTES] = $tamanhoArquivo;
                    }

                    $item->setMetadata($metadata);
                    $item->setCaminhoLocal(null);
                    $item->transicionarPara(StatusMediaItem::ARQUIVO_REMOVIDO);

                    $this->mediaItemRepository->salvar($item);
                }

                $totalRemovidos++;

                $this->logger?->info('Arquivo de vídeo do sistema removido com sucesso (preservando pasta do Syncthing).', [
                    'uuid' => $item->uuid()?->toString(),
                    'caminhoAnterior' => $caminhoLocal,
                    'tamanhoBytes' => $tamanhoArquivo,
                    'dryRun' => $dryRun,
                ]);
            } catch (\Throwable $e) {
                $uuidStr = $item->uuid()?->toString() ?? 'desconhecido';
                $erroMsg = sprintf('Erro ao remover arquivo do sistema para mídia %s: %s', $uuidStr, $e->getMessage());
                $erros[] = $erroMsg;
                $this->logger?->error($erroMsg);
            }
        }

        // Limpeza de arquivos residuais e soltos na pasta de downloads do sistema (/var/downloads)
        $espacoLiberadoBytes += $this->limparArquivosSoltosDownloads($dataLimite, $dryRun);

        return [
            'totalAnalisados' => $totalAnalisados,
            'totalRemovidos' => $totalRemovidos,
            'espacoLiberadoBytes' => $espacoLiberadoBytes,
            'espacoLiberadoFormatado' => self::formatarBytes($espacoLiberadoBytes),
            'erros' => $erros,
        ];
    }

    /**
     * Verifica se o caminho pertence à pasta de armazenamento/sincronização do Syncthing.
     * NUNCA devemos apagar arquivos que estejam nessa pasta para não apagar do celular do usuário.
     */
    public function isPastaSincronizadaComCelular(?string $caminho): bool
    {
        if (null === $caminho || '' === trim($caminho)) {
            return false;
        }

        $caminhoNormalizado = str_replace('\\', '/', $caminho);

        if (str_contains($caminhoNormalizado, '/var/storage/') ||
            str_contains($caminhoNormalizado, 'var/storage/') ||
            str_contains($caminhoNormalizado, 'sync_media/') ||
            str_contains($caminhoNormalizado, '/var/syncthing/')) {
            return true;
        }

        return false;
    }

    /**
     * Remove arquivos soltos antigos na pasta temporária de downloads do sistema (/var/downloads),
     * que não estão na pasta de sincronização do celular.
     */
    private function limparArquivosSoltosDownloads(\DateTimeImmutable $dataLimite, bool $dryRun): int
    {
        $baseDir = '' !== $this->projectDir ? $this->projectDir : '.';
        $downloadsDir = rtrim($baseDir, '/') . '/var/downloads';

        if (!is_dir($downloadsDir)) {
            return 0;
        }

        $bytesLiberados = 0;
        $timestampLimite = $dataLimite->getTimestamp();

        $extensoes = ['mp4', 'mkv', 'webm', 'mov', 'avi'];
        $itens = @scandir($downloadsDir) ?: [];
        $arquivos = [];
        foreach ($itens as $item) {
            if ('.' === $item || '..' === $item) {
                continue;
            }
            $caminhoCompleto = $downloadsDir . '/' . $item;
            $ext = strtolower(pathinfo($item, PATHINFO_EXTENSION));
            if (in_array($ext, $extensoes, true) && is_file($caminhoCompleto)) {
                $arquivos[] = $caminhoCompleto;
            }
        }
        foreach ($arquivos as $arquivo) {
            if (!is_file($arquivo)) {
                continue;
            }

            $mtime = (int) @filemtime($arquivo);
            if ($mtime <= $timestampLimite) {
                $tamanho = (int) @filesize($arquivo);
                if (!$dryRun) {
                    @unlink($arquivo);
                }
                $bytesLiberados += $tamanho;

                $this->logger?->info('Arquivo temporário de download do sistema removido da VPS.', [
                    'arquivo' => $arquivo,
                    'tamanho' => $tamanho,
                    'dryRun' => $dryRun,
                ]);
            }
        }

        return $bytesLiberados;
    }

    private function garantirThumbnailCache(MediaItem $item, string $caminhoFisico): void
    {
        $uuid = $item->uuid()?->toString();
        if (null === $uuid || '' === $uuid) {
            return;
        }

        $baseDir = '' !== $this->projectDir ? $this->projectDir : '.';
        $cacheDir = rtrim($baseDir, '/') . '/var/cache/thumbnails';
        if (!is_dir($cacheDir)) {
            @mkdir($cacheDir, 0777, true);
        }

        $cacheArquivo = sprintf('%s/%s.jpg', $cacheDir, $uuid);
        if (!file_exists($cacheArquivo) || filesize($cacheArquivo) === 0) {
            $cmd = sprintf('ffmpeg -y -ss 00:00:01 -i %s -vframes 1 -q:v 2 %s 2>/dev/null', escapeshellarg($caminhoFisico), escapeshellarg($cacheArquivo));
            @exec($cmd, $output, $ret);
            if (0 !== $ret || !file_exists($cacheArquivo) || filesize($cacheArquivo) === 0) {
                $cmd = sprintf('ffmpeg -y -ss 00:00:00 -i %s -vframes 1 -q:v 2 %s 2>/dev/null', escapeshellarg($caminhoFisico), escapeshellarg($cacheArquivo));
                @exec($cmd);
            }
        }
    }

    public static function formatarBytes(int $bytes): string
    {
        if ($bytes <= 0) {
            return '0 B';
        }

        $unidades = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = (int) floor(log($bytes, 1024));
        $i = min($i, count($unidades) - 1);
        $val = $bytes / (1024 ** $i);

        return sprintf('%.2f %s', $val, $unidades[$i]);
    }
}
