<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

use App\Entity\BloqueioSpotify;
use App\Entity\ContaSpotify;

final readonly class StatusSpotifyDTO
{
    public function __construct(
        public ?ContaSpotify $conta,
        public ?BloqueioSpotify $bloqueioAtivo,
    ) {
    }
}
