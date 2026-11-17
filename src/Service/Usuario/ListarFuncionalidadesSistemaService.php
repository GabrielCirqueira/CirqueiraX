<?php

declare(strict_types=1);

namespace App\Service\Usuario;

use App\Enum\FuncionalidadeSistema;

final class ListarFuncionalidadesSistemaService
{
    /**
     * @return list<array{codigo: string, descricao: string}>
     */
    public function executar(): array
    {
        $itens = [];
        foreach (FuncionalidadeSistema::cases() as $funcionalidade) {
            $itens[] = [
                'codigo' => $funcionalidade->value,
                'descricao' => $funcionalidade->descricao(),
            ];
        }

        return $itens;
    }
}
