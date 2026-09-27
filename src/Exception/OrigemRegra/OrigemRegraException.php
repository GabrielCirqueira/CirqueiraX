<?php

declare(strict_types=1);

namespace App\Exception\OrigemRegra;

final class OrigemRegraException extends \DomainException
{
    public static function regraNaoEncontrada(): self
    {
        return new self('A regra de origem para categoria não foi encontrada.', 404);
    }

    public static function regraDuplicada(string $origem): self
    {
        return new self(sprintf('Já existe uma regra de vinculação cadastrada para a origem "%s".', $origem), 409);
    }
}
