<?php

declare(strict_types=1);

namespace App\Service\MediaItem;

use App\Entity\MediaItem;
use App\Support\MetadataKeys;
use Psr\Log\LoggerInterface;
use Symfony\Component\Process\Process;

final readonly class AplicarMetadataArquivoService
{
    private const array EXTENSOES_VIDEO_SUPORTADAS = ['mp4', 'mov', 'm4v', 'mkv', 'webm'];

    public function __construct(
        private ?LoggerInterface $logger = null,
    ) {}

    public function aplicarEmMediaItem(MediaItem $mediaItem): bool
    {
        $caminhoLocal = $mediaItem->caminhoLocal();
        if (null === $caminhoLocal || '' === trim($caminhoLocal) || !file_exists($caminhoLocal) || !is_file($caminhoLocal)) {
            return false;
        }

        $metadata = $mediaItem->metadata();
        $dataStr = is_string($metadata[MetadataKeys::DATA] ?? null) ? (string) $metadata[MetadataKeys::DATA] : null;
        if (null === $dataStr || '' === trim($dataStr)) {
            return false;
        }

        $horario = is_string($metadata['horario'] ?? null) ? (string) $metadata['horario'] : null;
        $titulo = is_string($metadata[MetadataKeys::TITULO] ?? null) ? (string) $metadata[MetadataKeys::TITULO] : null;
        $uploader = is_string($metadata[MetadataKeys::UPLOADER] ?? null) ? (string) $metadata[MetadataKeys::UPLOADER] : null;

        return $this->aplicarEmArquivo($caminhoLocal, $dataStr, $horario, $titulo, $uploader);
    }

    public function aplicarEmArquivo(
        string $caminhoArquivo,
        string $data,
        ?string $horario = null,
        ?string $titulo = null,
        ?string $uploader = null,
    ): bool {
        if (!file_exists($caminhoArquivo) || !is_file($caminhoArquivo) || !is_writable($caminhoArquivo)) {
            $this->logger?->warning('Arquivo não encontrado ou sem permissão de escrita para aplicar metadados', [
                'caminho' => $caminhoArquivo,
            ]);

            return false;
        }

        $dateTime = $this->interpretarDataHora($data, $horario);
        if (null === $dateTime) {
            $this->logger?->warning('Não foi possível interpretar a data informada para aplicar metadados', [
                'data' => $data,
                'horario' => $horario,
                'caminho' => $caminhoArquivo,
            ]);

            return false;
        }

        $timestampEpoch = $dateTime->getTimestamp();
        $extensao = strtolower((string) pathinfo($caminhoArquivo, PATHINFO_EXTENSION));

        // Se for arquivo de vídeo suportado, injetar metadados de creation_time via FFmpeg
        if (in_array($extensao, self::EXTENSOES_VIDEO_SUPORTADAS, true)) {
            $this->injetarCreationTimeVideo($caminhoArquivo, $dateTime, $titulo, $uploader);
        }

        // Aplicar timestamp de criação e modificação no sistema de arquivos
        @touch($caminhoArquivo, $timestampEpoch, $timestampEpoch);

        return true;
    }

    public function interpretarDataHora(string $data, ?string $horario = null): ?\DateTimeImmutable
    {
        $dataLimpa = trim($data);
        if ('' === $dataLimpa) {
            return null;
        }

        $fusoPadrao = new \DateTimeZone('America/Sao_Paulo');

        // Formato compacto YYYYMMDD (ex: 20261012 do yt-dlp)
        if (preg_match('/^(\d{4})(\d{2})(\d{2})$/', $dataLimpa, $m)) {
            $dataLimpa = sprintf('%s-%s-%s', $m[1], $m[2], $m[3]);
        }

        // Se possui horário separado e a string não contém hora ainda
        if (!str_contains($dataLimpa, ':') && null !== $horario && '' !== trim($horario)) {
            $horarioLimpo = trim($horario);
            if (preg_match('/^\d{1,2}:\d{2}$/', $horarioLimpo)) {
                $horarioLimpo .= ':00';
            }
            $dataLimpa .= ' ' . $horarioLimpo;
        } elseif (!str_contains($dataLimpa, ':')) {
            // Se não tiver hora, define 12:00:00 (evita que a conversão UTC recue para o dia anterior)
            $dataLimpa .= ' 12:00:00';
        }

        try {
            return new \DateTimeImmutable($dataLimpa, $fusoPadrao);
        } catch (\Throwable $e) {
            $this->logger?->warning('Falha ao instanciar DateTimeImmutable', [
                'dataLimpa' => $dataLimpa,
                'erro' => $e->getMessage(),
            ]);

            return null;
        }
    }

    private function injetarCreationTimeVideo(
        string $caminhoArquivo,
        \DateTimeImmutable $dateTime,
        ?string $titulo = null,
        ?string $uploader = null,
    ): void {
        $dateTimeUtc = $dateTime->setTimezone(new \DateTimeZone('UTC'));
        $creationTimeUtc = $dateTimeUtc->format('Y-m-d\TH:i:s\Z');

        $extensao = strtolower((string) pathinfo($caminhoArquivo, PATHINFO_EXTENSION));
        $tempArquivo = sprintf('%s.meta_%s.%s', $caminhoArquivo, bin2hex(random_bytes(4)), $extensao);

        $args = [
            'ffmpeg',
            '-y',
            '-v', 'error',
            '-i', $caminhoArquivo,
            '-c', 'copy',
            '-metadata', 'creation_time=' . $creationTimeUtc,
            '-metadata:s:v', 'creation_time=' . $creationTimeUtc,
            '-metadata:s:a', 'creation_time=' . $creationTimeUtc,
        ];

        if (null !== $titulo && '' !== trim($titulo)) {
            $args[] = '-metadata';
            $args[] = 'title=' . trim($titulo);
        }

        if (null !== $uploader && '' !== trim($uploader)) {
            $args[] = '-metadata';
            $args[] = 'artist=' . trim($uploader);
        }

        $args[] = $tempArquivo;

        $process = new Process($args);
        $process->setTimeout(180.0);
        $process->run();

        if ($process->isSuccessful() && file_exists($tempArquivo) && filesize($tempArquivo) > 0) {
            $perms = @fileperms($caminhoArquivo) ?: 0664;
            if (@rename($tempArquivo, $caminhoArquivo)) {
                @chmod($caminhoArquivo, $perms);
                $this->logger?->info('Metadados de creation_time gravados no vídeo com sucesso via FFmpeg', [
                    'caminho' => $caminhoArquivo,
                    'creation_time' => $creationTimeUtc,
                ]);

                return;
            }
        }

        $this->logger?->warning('Falha ao injetar metadados no container via FFmpeg. Mantendo arquivo original com touch.', [
            'caminho' => $caminhoArquivo,
            'erro' => $process->getErrorOutput(),
        ]);

        if (file_exists($tempArquivo)) {
            @unlink($tempArquivo);
        }
    }
}
