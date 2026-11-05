<?php

declare(strict_types=1);

namespace App\Interface;

use App\DataObject\Spotify\ItemHistoricoImportadoDTO;
use Generator;

interface LeitorArquivoHistoricoSpotifyInterface
{
    /**
     * @return Generator<int, ItemHistoricoImportadoDTO>
     */
    public function ler(string $caminhoArquivo): Generator;
}

