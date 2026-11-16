<?php

declare(strict_types=1);

namespace App\DataObject\TransferenciaPlaylist;

final readonly class FaixaPlaylistDTO
{
    public function __construct(
        public string $idExterno,
        public string $titulo,
        public string $artistas,
        public ?int $duracaoMs = null,
        public ?string $urlCapa = null,
        public ?string $uri = null,
        public ?string $idItemPlaylist = null,
        public ?int $posicao = null,
    ) {
    }
}
