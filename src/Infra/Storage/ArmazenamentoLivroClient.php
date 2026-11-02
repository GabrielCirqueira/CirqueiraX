<?php

declare(strict_types=1);

namespace App\Infra\Storage;

use App\Exception\LivroAudio\LivroAudioException;
use App\Interface\ArmazenamentoLivroInterface;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final class ArmazenamentoLivroClient implements ArmazenamentoLivroInterface
{
    private const string NOME_ARQUIVO_PDF = 'original.pdf';
    private const int PERMISSAO_DIRETORIO = 0o775;

    public function __construct(
        private readonly string $diretorioBaseLivros,
    ) {}

    public function salvarPdf(UploadedFile $arquivo, string $livroUuid): string
    {
        $diretorioDestino = $this->diretorioBaseLivros . '/' . $livroUuid;

        if (!is_dir($diretorioDestino)) {
            if (!mkdir($diretorioDestino, self::PERMISSAO_DIRETORIO, true) && !is_dir($diretorioDestino)) {
                throw LivroAudioException::falhaAoSalvarArquivoPdf();
            }
            @chmod($diretorioDestino, self::PERMISSAO_DIRETORIO);
        }

        try {
            $arquivoSalvo = $arquivo->move($diretorioDestino, self::NOME_ARQUIVO_PDF);
            @chmod($arquivoSalvo->getPathname(), 0o664);

            return $arquivoSalvo->getPathname();
        } catch (FileException) {
            throw LivroAudioException::falhaAoSalvarArquivoPdf();
        }
    }

    public function obterCaminhoPdf(string $livroUuid): string
    {
        return $this->diretorioBaseLivros . '/' . $livroUuid . '/' . self::NOME_ARQUIVO_PDF;
    }

    public function existePdf(string $livroUuid): bool
    {
        $caminho = $this->obterCaminhoPdf($livroUuid);

        return file_exists($caminho) && is_file($caminho) && is_readable($caminho);
    }

    public function contarPaginasPdf(string $caminhoPdf): int
    {
        if (!file_exists($caminhoPdf) || !is_readable($caminhoPdf)) {
            return 0;
        }

        $conteudo = @file_get_contents($caminhoPdf);
        if (false === $conteudo) {
            return 0;
        }

        if (preg_match_all('/\/Count\s+(\d+)/', $conteudo, $matches)) {
            $maior = 0;
            foreach ($matches[1] as $valor) {
                $maior = max($maior, (int) $valor);
            }
            if ($maior > 0) {
                return $maior;
            }
        }

        $contagem = preg_match_all('/\/Type\s*\/Page(?![a-zA-Z])/', $conteudo);

        return $contagem > 0 ? $contagem : 1;
    }

    public function removerLivro(string $livroUuid): void
    {
        $diretorio = $this->diretorioBaseLivros . '/' . $livroUuid;

        if (!is_dir($diretorio)) {
            return;
        }

        $this->removerDiretorioRecursivo($diretorio);
    }

    private function removerDiretorioRecursivo(string $diretorio): void
    {
        $arquivos = scandir($diretorio);
        if (false === $arquivos) {
            return;
        }

        foreach ($arquivos as $arquivo) {
            if ('.' === $arquivo || '..' === $arquivo) {
                continue;
            }

            $caminhoCompleto = $diretorio . '/' . $arquivo;
            if (is_dir($caminhoCompleto)) {
                $this->removerDiretorioRecursivo($caminhoCompleto);
            } else {
                @unlink($caminhoCompleto);
            }
        }

        @rmdir($diretorio);
    }
}
