<?php

declare(strict_types=1);

namespace App\DataObject\IdentificacaoMusica;

use App\DataObject\Ia\RespostaIaDTO;

final readonly class ResultadoLoteIdentificacaoDTO
{
    /**
     * @param array<string, ResultadoIdentificacaoDTO> $resultados
     * @param list<string>                             $idsInvalidos
     */
    public function __construct(
        public array $resultados,
        public RespostaIaDTO $consumo,
        public array $idsInvalidos = [],
    ) {
    }
}
