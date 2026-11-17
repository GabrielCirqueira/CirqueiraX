<?php

declare(strict_types=1);

namespace App\Exception\Usuario;

use DomainException;

class UsuarioException extends DomainException
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

    public static function naoEncontrado(): self
    {
        return new self('Usuário não encontrado.', 404);
    }

    public static function permissaoNegada(?string $funcionalidade = null): self
    {
        if (null === $funcionalidade || '' === $funcionalidade) {
            return new self('Você não tem permissão para acessar este recurso.', 403);
        }

        return new self(sprintf('Você não tem permissão para acessar: %s.', $funcionalidade), 403);
    }

    public static function naoPodeAlterarProprioPerfilAdministrador(): self
    {
        return new self('Você não pode remover o próprio acesso de administrador.', 422);
    }

    public static function funcionalidadeInvalida(string $valor): self
    {
        return new self(sprintf('A funcionalidade "%s" não é válida.', $valor), 422);
    }
}
