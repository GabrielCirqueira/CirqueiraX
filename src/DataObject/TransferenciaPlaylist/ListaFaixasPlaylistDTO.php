<?php

declare(strict_types=1);

namespace App\DataObject\TransferenciaPlaylist;

final readonly class ListaFaixasPlaylistDTO
{
    /**
     * @param list<FaixaPlaylistDTO> $itens
     */
    public function __construct(
        public array $itens,
        public int $total,
        public ?int $proximoOffset = null,
        public ?string $proximoPageToken = null,
    ) {
    }
}
