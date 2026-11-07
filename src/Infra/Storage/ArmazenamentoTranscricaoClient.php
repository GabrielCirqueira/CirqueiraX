<?php

declare(strict_types=1);

namespace App\Infra\Storage;

use App\Exception\Transcricao\TranscricaoException;
use App\Interface\ArmazenamentoTranscricaoInterface;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final class ArmazenamentoTranscricaoClient implements ArmazenamentoTranscricaoInterface
{
    private const int PERMISSAO_DIRETORIO = 0o775;
    private const string EXTENSAO_PADRAO = 'bin';
    private const string PADRAO_EXTENSAO_VALIDA = '/^[a-z0-9]{1,8}$/';

    public function __construct(
        private readonly string $diretorioBaseTranscricoes,
    ) {}

    public function salvarAudio(UploadedFile $arquivo, string $transcricaoUuid): string
    {
        $this->garantirDiretorio($this->diretorioBaseTranscricoes);
        $nomeArquivo = sprintf('%s.%s', $transcricaoUuid, $this->extrairExtensao($arquivo));

        try {
            return $arquivo->move($this->diretorioBaseTranscricoes, $nomeArquivo)->getPathname();
        } catch (FileException) {
            throw TranscricaoException::falhaAoSalvarAudio();
        }
    }

    public function existe(string $caminho): bool
    {
        return is_file($caminho) && is_readable($caminho);
    }

    public function remover(string $caminho): int
    {
        if (!is_file($caminho)) {
            return 0;
        }

        $tamanhoBytes = (int) filesize($caminho);
        if (!unlink($caminho)) {
            throw TranscricaoException::falhaAoRemoverAudio($caminho);
        }

        return $tamanhoBytes;
    }

    private function garantirDiretorio(string $diretorio): void
    {
        if (is_dir($diretorio)) {
            return;
        }

        if (!mkdir($diretorio, self::PERMISSAO_DIRETORIO, true) && !is_dir($diretorio)) {
            throw TranscricaoException::falhaAoSalvarAudio();
        }
    }

    private function extrairExtensao(UploadedFile $arquivo): string
    {
        $extensao = mb_strtolower($arquivo->getClientOriginalExtension());
        if (1 === preg_match(self::PADRAO_EXTENSAO_VALIDA, $extensao)) {
            return $extensao;
        }

        return $arquivo->guessExtension() ?? self::EXTENSAO_PADRAO;
    }
}
