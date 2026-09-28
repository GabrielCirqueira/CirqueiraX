<?php

declare(strict_types=1);

namespace App\Exception\Usuario;

class UsuarioException extends \DomainException
{
    public static function emailJaEmUso(string $email): self
    {
        return new self(sprintf('O endereço de e-mail "%s" já está cadastrado no sistema.', $email), 409);
    }

    public static function usernameJaEmUso(string $username): self
    {
        return new self(sprintf('O nome de usuário "%s" já está em uso.', $username), 409);
    }

    public static function dadosInvalidos(string $motivo): self
    {
        return new self(sprintf('Dados de usuário inválidos: %s', $motivo), 422);
    }
}
