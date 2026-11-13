<?php

declare(strict_types=1);

namespace App\Exception\Ia;

use DomainException;

final class PoolIaException extends DomainException
{
    private const int CODIGO_SEM_PROVEDOR = 503;

    public static function nenhumProvedorDisponivel(): self
    {
        return new self('Nenhum provedor de IA está disponível agora: todos estão sem chave, bloqueados ou fora do limite gratuito.', self::CODIGO_SEM_PROVEDOR);
    }

    public static function todosOsProvedoresFalharam(): self
    {
        return new self('Todos os provedores de IA disponíveis falharam neste pedido. Ele será tentado de novo mais tarde.', self::CODIGO_SEM_PROVEDOR);
    }
}
