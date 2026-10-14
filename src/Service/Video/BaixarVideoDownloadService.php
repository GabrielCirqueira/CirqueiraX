<?php

declare(strict_types=1);

namespace App\Service\Video;

use App\Infra\YtDlp\YtDlpClient;
use App\Interface\ArmazenamentoInterface;
use App\Support\MetadataKeys;
use App\Support\TextoUtil;

final readonly class BaixarVideoDownloadService
{
    private const string SUBDIR_DOWNLOADS = 'downloads';
    private const string CAMINHO_STORAGE_PADRAO = './var/storage';

    public function __construct(
        private YtDlpClient $ytDlpClient,
        private ArmazenamentoInterface $armazenamentoClient,
        private string $mediaStoragePath = self::CAMINHO_STORAGE_PADRAO,
        private string $projectDir = '',
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function extrairMetadata(string $url): array
    {
        $dados = $this->ytDlpClient->extrairMetadata($url);
        $thumbnail = $this->extrairThumbnail($dados);
        $agora = new \DateTimeImmutable('now', new \DateTimeZone('America/Sao_Paulo'));

        return [
            MetadataKeys::TITULO => $dados['title'] ?? null,
            MetadataKeys::UPLOADER => $dados['uploader'] ?? ($dados['uploader_id'] ?? null),
            MetadataKeys::DURACAO => $dados['duration'] ?? null,
            MetadataKeys::DATA => $agora->format('Y-m-d H:i:s'),
            'horario' => $agora->format('H:i'),
            MetadataKeys::EXTENSAO => $dados['ext'] ?? null,
            MetadataKeys::THUMBNAIL => $thumbnail,
            MetadataKeys::URL_ORIGINAL => $url,
        ];
    }

    public function baixarParaStorage(string $url): string
    {
        $diretorioDestino = $this->resolverDiretorioDestino();
        $this->armazenamentoClient->criarDiretorio($diretorioDestino);

        return $this->ytDlpClient->baixarVideo($url, $diretorioDestino);
    }

    /**
     * @param array<string, mixed> $dados
     */
    private function extrairThumbnail(array $dados): ?string
    {
        if (isset($dados['thumbnail']) && is_string($dados['thumbnail']) && TextoUtil::naoEstaEmBranco($dados['thumbnail'])) {
            return $dados['thumbnail'];
        }

        if (isset($dados['thumbnails']) && is_array($dados['thumbnails']) && !empty($dados['thumbnails'])) {
            $ultimaThumbnail = end($dados['thumbnails']);
            if (is_array($ultimaThumbnail) && isset($ultimaThumbnail['url']) && is_string($ultimaThumbnail['url'])) {
                return $ultimaThumbnail['url'];
            }
        }

        return null;
    }

    private function resolverDiretorioDestino(): string
    {
        $base = '' !== $this->projectDir ? $this->projectDir : '.';

        return rtrim($base, '/') . '/var/downloads';
    }

    private function resolverCaminhoBaseStorage(): string
    {
        $baseStorage = str_starts_with($this->mediaStoragePath, '/')
            ? $this->mediaStoragePath
            : rtrim($this->projectDir, '/') . '/' . ltrim($this->mediaStoragePath, './');

        if (!is_dir($baseStorage) && '' !== $this->projectDir && is_dir($this->projectDir . '/var/storage')) {
            return $this->projectDir . '/var/storage';
        }

        return $baseStorage;
    }
}
