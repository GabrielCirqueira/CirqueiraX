<?php

declare(strict_types=1);

namespace App\DataObject\IdentificacaoMusica;

final readonly class ResultadoLoteIdentificacaoDTO
{
    /**
     * @param array<string, ResultadoIdentificacaoDTO> $resultados
     * @param list<string>                             $idsInvalidos
     */
    public function __construct(
        public array $resultados,
        public string $modelo,
        public int $tokensEntrada,
        public int $tokensSaida,
        public array $idsInvalidos = [],
    ) {
    }
}
