<?php

declare(strict_types=1);

namespace App\DataObject\TransferenciaPlaylist;

final readonly class ParPlaylistDetectadoDTO
{
    public function __construct(
        public PlaylistResumoDTO $origem,
        public ?PlaylistResumoDTO $destino = null,
        public float $similaridade = 0.0,
    ) {
    }
}
