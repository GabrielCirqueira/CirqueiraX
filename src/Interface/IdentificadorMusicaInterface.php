<?php

declare(strict_types=1);

namespace App\Interface;

use App\DataObject\IdentificacaoMusica\EntradaIdentificacaoDTO;
use App\DataObject\IdentificacaoMusica\ResultadoLoteIdentificacaoDTO;

interface IdentificadorMusicaInterface
{
    public const int TAMANHO_LOTE_IDENTIFICACAO = 10;

    /**
     * @param list<EntradaIdentificacaoDTO> $entradas
     */
    public function identificar(array $entradas): ResultadoLoteIdentificacaoDTO;
}
