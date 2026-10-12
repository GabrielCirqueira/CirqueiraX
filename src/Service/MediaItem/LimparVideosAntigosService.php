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
     *     totalExpurgados: int,
     *     espacoLiberadoBytes: int,
     *     espacoLiberadoFormatado: string,
     *     erros: list<string>
     * }
     */
    public function executar(int $dias = 7, bool $dryRun = false): array
    {
        $dataLimite = (new \DateTimeImmutable())->modify(sprintf('-%d days', $dias));
        $videos = $this->mediaItemRepository->buscarVideosParaExpurgo($dataLimite);

        $totalAnalisados = count($videos);
        $totalExpurgados = 0;
        $espacoLiberadoBytes = 0;
        $erros = [];

        foreach ($videos as $item) {
            try {
                // Validação estrita: somente vídeos, NUNCA imagens/prints
                if (!$item->isVideo() || $item->isPrint()) {
                    continue;
                }

                $caminhoLocal = $item->caminhoLocal();
                $tamanhoArquivo = 0;

                if (null !== $caminhoLocal && '' !== trim($caminhoLocal) && file_exists($caminhoLocal)) {
                    $tamanhoArquivo = (int) @filesize($caminhoLocal);

                    // Garante que a miniatura local em cache exista antes de apagar o arquivo de vídeo
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
                    $metadata[MetadataKeys::ARQUIVO_EXPURGADO_EM] = (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM);

                    // Preserva o tamanho nos metadados para fins estatísticos
                    if ($tamanhoArquivo > 0 && !isset($metadata[MetadataKeys::TAMANHO_BYTES])) {
                        $metadata[MetadataKeys::TAMANHO_BYTES] = $tamanhoArquivo;
                    }

                    $item->setMetadata($metadata);
                    $item->setCaminhoLocal(null);
                    $item->transicionarPara(StatusMediaItem::ARQUIVO_EXPURGADO);

                    $this->mediaItemRepository->salvar($item);
                }

                $totalExpurgados++;

                $this->logger?->info('Vídeo antigo expurgado com sucesso.', [
                    'uuid' => $item->uuid()?->toString(),
                    'caminhoAnterior' => $caminhoLocal,
                    'tamanhoBytes' => $tamanhoArquivo,
                    'dryRun' => $dryRun,
                ]);
            } catch (\Throwable $e) {
                $uuidStr = $item->uuid()?->toString() ?? 'desconhecido';
                $erroMsg = sprintf('Erro ao expurgar mídia %s: %s', $uuidStr, $e->getMessage());
                $erros[] = $erroMsg;
                $this->logger?->error($erroMsg);
            }
        }

        return [
            'totalAnalisados' => $totalAnalisados,
            'totalExpurgados' => $totalExpurgados,
            'espacoLiberadoBytes' => $espacoLiberadoBytes,
            'espacoLiberadoFormatado' => self::formatarBytes($espacoLiberadoBytes),
            'erros' => $erros,
        ];
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
