<?php

declare(strict_types=1);

namespace App\DataObject\YoutubeMusic;

final readonly class ResultadoBuscaYoutubeMusicDTO
{
    /**
     * @param list<ItemHistoricoYoutubeMusicDTO> $itens
     */
    public function __construct(
        public array $itens,
    ) {
    }
}
