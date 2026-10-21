<?php

declare(strict_types=1);

namespace App\Exception\GoogleFotos;

use DomainException;

class RegistroEnvioGoogleFotosException extends DomainException
{
    public static function registroNaoEncontrado(): self
    {
        return new self('O registro de envio ao Google Fotos informado não foi encontrado.', 404);
    }

    public static function midiaJaEnviada(): self
    {
        return new self('Esta mídia já está no Google Fotos e não precisa ser reenviada.', 409);
    }
}
