<?php

declare(strict_types=1);

namespace App\Exception\Categoria;

final class CategoriaException extends \DomainException
{
    public static function categoriaNaoEncontrada(): self
    {
        return new self('A categoria solicitada não foi encontrada no sistema.', 404);
    }

    public static function nomeJaExiste(string $nome): self
    {
        return new self(sprintf('Já existe uma categoria cadastrada com o nome "%s".', $nome), 409);
    }
}
