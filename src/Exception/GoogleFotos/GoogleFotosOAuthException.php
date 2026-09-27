<?php

declare(strict_types=1);

namespace App\Exception\GoogleFotos;

class GoogleFotosOAuthException extends \DomainException
{
    public static function falhaAoRenovarAccessTokenDoGoogle(): self
    {
        return new self('Ocorreu uma falha ao renovar o access token junto à API do Google Fotos.', 400);
    }
}
