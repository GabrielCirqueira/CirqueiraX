<?php

declare(strict_types=1);

namespace App\Service;

use Symfony\Component\Process\Process;

final readonly class ExtrairMetadataVideoService
{
    /**
     * @return array{
     *     titulo: string,
     *     uploader: string,
     *     duracao: int,
     *     thumbnail: string,
     *     plataforma: string,
     *     url_original: string
     * }
     */
    public function extrair(string $url): array
    {
        $process = new Process(['yt-dlp', '--dump-json', '--no-playlist', $url]);
        $process->setTimeout(60.0);
        $process->run();

        if (!$process->isSuccessful()) {
            throw new \DomainException('erro_extrair_metadata_video: '.$process->getErrorOutput(), 400);
        }

        $dados = json_decode($process->getOutput(), true);
        if (!is_array($dados)) {
            throw new \DomainException('erro_parse_metadata_video', 500);
        }

        return [
            'titulo' => (string) ($dados['title'] ?? $dados['fulltitle'] ?? 'Vídeo sem título'),
            'uploader' => (string) ($dados['uploader'] ?? $dados['channel'] ?? $dados['creator'] ?? 'Desconhecido'),
            'duracao' => (int) ($dados['duration'] ?? 0),
            'thumbnail' => (string) ($dados['thumbnail'] ?? ''),
            'plataforma' => (string) ($dados['extractor_key'] ?? $dados['extractor'] ?? 'outros'),
            'url_original' => $url,
        ];
    }
}
