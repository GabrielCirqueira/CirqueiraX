<?php

declare(strict_types=1);

namespace App\DataObject\YoutubeMusic;

use App\Entity\ReproducaoYoutube;
use DateTimeImmutable;

final readonly class ResumoExtensaoYoutubeDTO
{
    public function __construct(
        public int $aparelhosAtivos,
        public ?DateTimeImmutable $ultimoEventoEm,
        public ?ReproducaoYoutube $tocandoAgora,
    ) {
    }
}
