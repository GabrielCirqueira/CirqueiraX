<?php

declare(strict_types=1);

namespace App\DataObject\YoutubeMusic;

final readonly class ListaHistoricoYoutubeMusicDTO
{
    /**
     * @param list<ItemHistoricoYoutubeMusicDTO> $itens
     */
    public function __construct(
        public array $itens,
    ) {
    }

    /**
     * @return list<string>
     */
    public function videoIds(): array
    {
        return array_map(static fn (ItemHistoricoYoutubeMusicDTO $item): string => $item->videoId, $this->itens);
    }
}
