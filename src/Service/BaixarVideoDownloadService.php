<?php

declare(strict_types=1);

namespace App\Service;

use Symfony\Component\Process\Process;

final readonly class BaixarVideoDownloadService
{
    public function __construct(
        private ExtrairMetadataVideoService $extrairMetadataVideoService,
    ) {
    }

    /**
     * @return array{
     *     caminho_arquivo: string,
     *     metadata: array<string, mixed>
     * }
     */
    public function executar(string $url, ?string $diretorioDestino = null): array
    {
        $diretorio = $diretorioDestino ?? sys_get_temp_dir().'/cirqueirax_downloads';
        if (!is_dir($diretorio) && !mkdir($diretorio, 0755, true) && !is_dir($diretorio)) {
            throw new \DomainException('erro_criar_diretorio_temp_download', 500);
        }

        $metadata = $this->extrairMetadataVideoService->extrair($url);

        $templateSaida = $diretorio.'/%(id)s.%(ext)s';
        $process = new Process([
            'yt-dlp',
            '--no-playlist',
            '--format',
            'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            '--output',
            $templateSaida,
            '--print',
            'after_move:filepath',
            $url,
        ]);
        $process->setTimeout(300.0);
        $process->run();

        if (!$process->isSuccessful()) {
            throw new \DomainException('falha_download_video: '.$process->getErrorOutput(), 500);
        }

        $linhas = explode("\n", trim($process->getOutput()));
        $caminhoArquivo = trim((string) end($linhas));

        if ('' === $caminhoArquivo || !file_exists($caminhoArquivo)) {
            throw new \DomainException('arquivo_baixado_nao_encontrado', 500);
        }

        return [
            'caminho_arquivo' => $caminhoArquivo,
            'metadata' => $metadata,
        ];
    }
}
