<?php

declare(strict_types=1);

namespace App\Service\Video;

use App\Infra\Storage\ArmazenamentoLocalClient;
use App\Infra\YtDlp\YtDlpClient;

final readonly class BaixarVideoDownloadService
{
    private const string SUBDIR_DOWNLOADS = 'cirqueirax_downloads';

    public function __construct(
        private YtDlpClient $ytDlpClient,
        private ArmazenamentoLocalClient $armazenamentoLocalClient,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function extrairMetadata(string $url): array
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

    public function baixarParaStorage(string $url): string
    {
        $diretorioDestino = sys_get_temp_dir() . '/' . self::SUBDIR_DOWNLOADS;
        $this->armazenamentoLocalClient->criarDiretorio($diretorioDestino);

        return $this->ytDlpClient->baixarVideo($url, $diretorioDestino);
    }
}
