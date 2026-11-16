<?php

declare(strict_types=1);

namespace App\DataObject\TransferenciaPlaylist;

final readonly class PlaylistResumoDTO
{
    public function __construct(
        public string $id,
        public string $nome,
        public int $totalFaixas,
        public ?string $urlCapa = null,
        public ?string $snapshotId = null,
        public ?string $dono = null,
    ) {
    }
}
