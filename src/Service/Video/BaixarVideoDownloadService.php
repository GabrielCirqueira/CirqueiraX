<?php

declare(strict_types=1);

namespace App\Service\Video;

use App\Infra\Storage\ArmazenamentoLocalClient;
use App\Infra\YtDlp\YtDlpClient;

final readonly class BaixarVideoDownloadService
{
    private const string SUBDIR_DOWNLOADS = 'downloads';

    public function __construct(
        private YtDlpClient $ytDlpClient,
        private ArmazenamentoLocalClient $armazenamentoLocalClient,
        private string $mediaStoragePath = './var/storage',
        private string $projectDir = '',
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function extrairMetadata(string $url): array
    {
        $dados = $this->ytDlpClient->extrairMetadata($url);

        $thumbnail = null;
        if (isset($dados['thumbnail']) && is_string($dados['thumbnail']) && '' !== trim($dados['thumbnail'])) {
            $thumbnail = $dados['thumbnail'];
        } elseif (isset($dados['thumbnails']) && is_array($dados['thumbnails']) && !empty($dados['thumbnails'])) {
            $lastThumb = end($dados['thumbnails']);
            if (is_array($lastThumb) && isset($lastThumb['url']) && is_string($lastThumb['url'])) {
                $thumbnail = $lastThumb['url'];
            }
        }

        return [
            'titulo' => $dados['title'] ?? null,
            'uploader' => $dados['uploader'] ?? ($dados['uploader_id'] ?? null),
            'duracao' => $dados['duration'] ?? null,
            'data' => $dados['upload_date'] ?? null,
            'extensao' => $dados['ext'] ?? null,
            'thumbnail' => $thumbnail,
            'url_original' => $url,
        ];
    }

    public function baixarParaStorage(string $url): string
    {
        $baseStorage = str_starts_with($this->mediaStoragePath, '/')
        ? $this->mediaStoragePath
        : rtrim($this->projectDir, '/') . '/' . ltrim($this->mediaStoragePath, './');

        $diretorioDestino = rtrim($baseStorage, '/') . '/' . self::SUBDIR_DOWNLOADS;
        $this->armazenamentoLocalClient->criarDiretorio($diretorioDestino);

        return $this->ytDlpClient->baixarVideo($url, $diretorioDestino);
    }
}
