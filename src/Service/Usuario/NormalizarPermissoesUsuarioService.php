<?php

declare(strict_types=1);

namespace App\Service\Usuario;

use App\Enum\FuncionalidadeSistema;
use App\Exception\Usuario\UsuarioException;

final class NormalizarPermissoesUsuarioService
{
    /**
     * @param list<string>|null $permissoes
     *
     * @return list<string>
     */
    public function executar(?array $permissoes): array
    {
        if (null === $permissoes) {
            return [];
        }

        $normalizadas = [];
        foreach ($permissoes as $permissao) {
            $funcionalidade = FuncionalidadeSistema::tryFrom($permissao);
            if (null === $funcionalidade) {
                throw UsuarioException::funcionalidadeInvalida($permissao);
            }
            $normalizadas[] = $funcionalidade->value;
        }

        return array_values(array_unique($normalizadas));
    }
}
