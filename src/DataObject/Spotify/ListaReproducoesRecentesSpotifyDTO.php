<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class ListaReproducoesRecentesSpotifyDTO
{
    /**
     * @param array<int, ItemReproducaoRecenteDTO> $itens
     */
    public function __construct(
        public array $itens,
        public ?int $cursorAfterMs,
    ) {
    }
}
