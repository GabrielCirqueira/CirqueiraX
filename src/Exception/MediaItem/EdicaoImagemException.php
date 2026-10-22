<?php

declare(strict_types=1);

namespace App\Exception\MediaItem;

use DomainException;

class EdicaoImagemException extends DomainException
{
    public static function arquivoDaEdicaoNaoInformado(): self
    {
        return new self('A imagem editada é obrigatória e não foi enviada.', 400);
    }

    public static function falhaAoSalvarArquivoDaEdicao(): self
    {
        return new self('Ocorreu uma falha ao salvar a imagem editada no armazenamento temporário.', 500);
    }

    public static function midiaDeOrigemNaoEncontrada(): self
    {
        return new self('A mídia original da edição não foi encontrada.', 404);
    }

    public static function midiaDeOrigemNaoEditavel(): self
    {
        return new self('Somente imagens com o arquivo disponível podem ser editadas.', 422);
    }
}
