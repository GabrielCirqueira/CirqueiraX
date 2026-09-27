<?php

declare(strict_types=1);

namespace App\Service\Video;

use App\Infra\YtDlp\YtDlpClient;

final readonly class ExtrairMetadataVideoService
{
    public function __construct(
        private YtDlpClient $ytDlpClient,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function extrair(string $url): array
    {
        $dados = $this->ytDlpClient->extrairMetadata($url);

        return [
            'titulo' => $dados['title'] ?? null,
            'uploader' => $dados['uploader'] ?? ($dados['uploader_id'] ?? null),
            'duracao' => $dados['duration'] ?? null,
            'data' => $dados['upload_date'] ?? null,
            'extensao' => $dados['ext'] ?? null,
            'url_original' => $url,
        ];
    }
}
