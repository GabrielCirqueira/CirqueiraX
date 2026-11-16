<?php

declare(strict_types=1);

namespace App\DataObject\TransferenciaPlaylist;

final readonly class CanalYoutubeOAuthDTO
{
    public function __construct(
        public string $canalId,
        public string $titulo,
    ) {
    }
}
