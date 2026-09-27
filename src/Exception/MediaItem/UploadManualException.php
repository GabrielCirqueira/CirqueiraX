<?php

declare(strict_types=1);

namespace App\Exception\MediaItem;

class UploadManualException extends \DomainException
{
    public static function arquivoUploadNaoInformado(): self
    {
        return new self('O arquivo para upload manual é obrigatório e não foi fornecido.', 400);
    }

    public static function falhaAoSalvarArquivoDeUpload(): self
    {
        return new self('Ocorreu uma falha ao mover e salvar o arquivo de upload no armazenamento temporário.', 500);
    }

    public static function falhaAoCalcularHashDoArquivo(): self
    {
        return new self('Não foi possível calcular o hash SHA-256 do arquivo enviado.', 500);
    }
}
