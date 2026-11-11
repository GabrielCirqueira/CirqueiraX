<?php

declare(strict_types=1);

namespace App\Infra\YoutubeMusic;

use App\Exception\ImportacaoYoutube\ImportacaoYoutubeException;
use App\Interface\ArmazenamentoImportacaoYoutubeInterface;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final readonly class ArmazenamentoImportacaoYoutubeClient implements ArmazenamentoImportacaoYoutubeInterface
{
    private const int PERMISSAO_DIRETORIO = 0o770;
    private const int PERMISSAO_ARQUIVO = 0o660;
    private const string FORMATO_NOME = '%s.%s';

    public function __construct(
        private string $diretorioTemporario,
    ) {
    }

    public function salvarArquivoTemporario(UploadedFile $arquivo, string $importacaoUuid): string
    {
        if (!is_dir($this->diretorioTemporario) && !mkdir($this->diretorioTemporario, self::PERMISSAO_DIRETORIO, true) && !is_dir($this->diretorioTemporario)) {
            throw ImportacaoYoutubeException::falhaAoArmazenar();
        }

        $extensao = mb_strtolower($arquivo->getClientOriginalExtension());

        try {
            $salvo = $arquivo->move($this->diretorioTemporario, sprintf(self::FORMATO_NOME, $importacaoUuid, $extensao));
        } catch (FileException) {
            throw ImportacaoYoutubeException::falhaAoArmazenar();
        }

        @chmod($salvo->getPathname(), self::PERMISSAO_ARQUIVO);

        return $salvo->getPathname();
    }

    public function removerArquivo(string $caminho): void
    {
        if (is_file($caminho)) {
            @unlink($caminho);
        }
    }
}
