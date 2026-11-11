<?php

declare(strict_types=1);

namespace App\Interface;

use App\DataObject\YoutubeMusic\ItemHistoricoTakeoutYoutubeDTO;
use Generator;

interface LeitorArquivoTakeoutYoutubeInterface
{
    /**
     * @return Generator<int, ItemHistoricoTakeoutYoutubeDTO, mixed, int>
     */
    public function ler(string $caminhoArquivo): Generator;
}
