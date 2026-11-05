<?php

declare(strict_types=1);

namespace App\Infra\Spotify;

use App\Exception\Spotify\SpotifyException;
use App\Interface\ArmazenamentoImportacaoSpotifyInterface;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final class ArmazenamentoImportacaoSpotifyClient implements ArmazenamentoImportacaoSpotifyInterface
{
    private const int PERMISSAO_DIRETORIO = 0o775;

    public function __construct(
        private readonly string $diretorioTemporario,
    ) {}

    public function salvarArquivoTemporario(UploadedFile $arquivo, string $importacaoUuid): string
    {
        if (!is_dir($this->diretorioTemporario)) {
            if (!mkdir($this->diretorioTemporario, self::PERMISSAO_DIRETORIO, true) && !is_dir($this->diretorioTemporario)) {
                throw SpotifyException::falhaAoArmazenarArquivoImportacao();
            }
            @chmod($this->diretorioTemporario, self::PERMISSAO_DIRETORIO);
        }

        $nomeOriginalLimpo = preg_replace('/[^a-zA-Z0-9_.-]/', '_', (string) $arquivo->getClientOriginalName()) ?? 'historico.zip';
        $nomeFinal = sprintf('%s_%s', $importacaoUuid, $nomeOriginalLimpo);

        try {
            $arquivoSalvo = $arquivo->move($this->diretorioTemporario, $nomeFinal);
            @chmod($arquivoSalvo->getPathname(), 0o664);

            return $arquivoSalvo->getPathname();
        } catch (FileException) {
            throw SpotifyException::falhaAoArmazenarArquivoImportacao();
        }
    }

    public function removerArquivo(string $caminho): void
    {
        if (file_exists($caminho) && is_file($caminho)) {
            @unlink($caminho);
        }
    }
}
