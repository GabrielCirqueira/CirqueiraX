<?php

declare(strict_types=1);

namespace App\Exception\Ingestao;

class IngestarPrintException extends \DomainException
{
    public static function arquivoDePrintNaoInformado(): self
    {
        return new self('O arquivo de imagem do print é obrigatório e não foi informado na requisição.', 400);
    }

    public static function falhaAoSalvarArquivoDePrint(): self
    {
        return new self('Ocorreu uma falha ao salvar o arquivo de imagem do print no diretório temporário.', 500);
    }
}
