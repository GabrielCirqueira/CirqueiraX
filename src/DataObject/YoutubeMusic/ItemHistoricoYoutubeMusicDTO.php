<?php

declare(strict_types=1);

namespace App\DataObject\YoutubeMusic;

final readonly class ItemHistoricoYoutubeMusicDTO
{
    public function __construct(
        public string $videoId,
        public string $titulo,
        public string $textoArtistas,
        public ?string $album,
        public ?string $urlCapa,
        public ?int $duracaoMs,
        public ?string $secao,
        public int $posicao,
        public ?string $tipoVideo,
    ) {
    }
}
