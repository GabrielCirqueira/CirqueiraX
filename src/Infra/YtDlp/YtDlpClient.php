<?php

declare(strict_types=1);

namespace App\Infra\YtDlp;

use App\Exception\Video\YtDlpException;
use App\Interface\ExtratorVideoInterface;
use Symfony\Component\Process\Process;

final class YtDlpClient implements ExtratorVideoInterface
{
    private const float TIMEOUT_EXTRACAO_METADATA_SEGUNDOS = 60.0;
    private const float TIMEOUT_DOWNLOAD_VIDEO_SEGUNDOS = 300.0;
    private const string FORMATO_VIDEO_PREFERIDO = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';

    /**
     * @return array<string, mixed>
     */
    public function extrairMetadata(string $url): array
    {
        $process = new Process(['yt-dlp', '--dump-json', '--no-playlist', $url]);
        $process->setTimeout(self::TIMEOUT_EXTRACAO_METADATA_SEGUNDOS);
        $process->run();

        if (!$process->isSuccessful()) {
            throw YtDlpException::falhaAoExtrairMetadataDoVideo();
        }

        /** @var mixed $dados */
        $dados = json_decode($process->getOutput(), true);
        if (!is_array($dados)) {
            throw YtDlpException::falhaAoProcessarJsonDeMetadata();
        }

        /** @var array<string, mixed> $dados */
        return $dados;
    }

    public function baixarVideo(string $url, string $diretorioDestino): string
    {
        $templateSaida = $diretorioDestino . '/%(id)s.%(ext)s';
        $process = new Process([
            'yt-dlp',
            '--no-playlist',
            '--format',
            self::FORMATO_VIDEO_PREFERIDO,
            '--output',
            $templateSaida,
            '--print',
            'after_move:filepath',
            $url,
        ]);
        $process->setTimeout(self::TIMEOUT_DOWNLOAD_VIDEO_SEGUNDOS);
        $process->run();

        if (!$process->isSuccessful()) {
            throw YtDlpException::falhaAoEfetuarDownloadDoVideo();
        }

        $linhas = array_filter(explode("\n", trim($process->getOutput())));
        $caminhoArquivo = trim((string) end($linhas));

        if ('' === $caminhoArquivo || !file_exists($caminhoArquivo)) {
            throw YtDlpException::arquivoDeVideoBaixadoNaoEncontrado();
        }

        return $caminhoArquivo;
    }
}
