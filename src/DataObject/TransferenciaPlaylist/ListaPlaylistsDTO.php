<?php

declare(strict_types=1);

namespace App\DataObject\TransferenciaPlaylist;

final readonly class ListaPlaylistsDTO
{
    /**
     * @param list<PlaylistResumoDTO> $itens
     */
    public function __construct(
        public array $itens,
        public int $total,
        public ?string $proximoPageToken = null,
    ) {
    }
}
