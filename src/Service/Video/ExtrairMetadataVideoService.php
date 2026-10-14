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
        $agora = new \DateTimeImmutable('now', new \DateTimeZone('America/Sao_Paulo'));

        return [
            'titulo' => $dados['title'] ?? null,
            'uploader' => $dados['uploader'] ?? ($dados['uploader_id'] ?? null),
            'duracao' => $dados['duration'] ?? null,
            'data' => $agora->format('Y-m-d H:i:s'),
            'horario' => $agora->format('H:i'),
            'extensao' => $dados['ext'] ?? null,
            'url_original' => $url,
        ];
    }
}
