<?php

declare(strict_types=1);

namespace App\DataObject\TransferenciaPlaylist;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class SincronizarVinculoPlaylistDTO
{
    public function __construct(
        #[Assert\Type('bool')]
        public bool $force = false,
    ) {
    }
}
