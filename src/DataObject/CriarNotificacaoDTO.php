<?php

declare(strict_types=1);

namespace App\DataObject;

use App\Enum\TipoNotificacao;

final readonly class CriarNotificacaoDTO
{
    public function __construct(
        public TipoNotificacao $tipo,
        public string $titulo,
        public string $mensagem,
        public ?int $usuarioId = null,
    ) {}
}
