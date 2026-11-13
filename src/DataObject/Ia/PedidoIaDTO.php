<?php

declare(strict_types=1);

namespace App\DataObject\Ia;

final readonly class PedidoIaDTO
{
    public const int MAXIMO_TOKENS_SAIDA_PADRAO = 4000;

    public function __construct(
        public string $instrucoes,
        public string $conteudo,
        public ?EsquemaRespostaIaDTO $esquemaResposta = null,
        public int $maximoTokensSaida = self::MAXIMO_TOKENS_SAIDA_PADRAO,
    ) {
    }

    public function isEstruturado(): bool
    {
        return null !== $this->esquemaResposta;
    }
}
