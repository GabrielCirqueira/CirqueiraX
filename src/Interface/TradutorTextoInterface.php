<?php

declare(strict_types=1);

namespace App\Interface;

use App\DataObject\Pronuncia\TraducaoDTO;
use App\DataObject\Pronuncia\UsoTraducaoDTO;
use App\Enum\IdiomaFrase;

interface TradutorTextoInterface
{
    public function traduzir(string $texto, IdiomaFrase $destino, ?IdiomaFrase $origem = null): TraducaoDTO;

    /**
     * @param list<string> $textos
     *
     * @return list<string> traduções na mesma ordem dos textos
     */
    public function traduzirLote(array $textos, IdiomaFrase $destino, ?IdiomaFrase $origem = null): array;

    public function consultarUso(): UsoTraducaoDTO;
}
