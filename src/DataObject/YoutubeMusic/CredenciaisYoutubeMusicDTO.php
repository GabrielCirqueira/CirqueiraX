<?php

declare(strict_types=1);

namespace App\DataObject\YoutubeMusic;

use SensitiveParameter;

final readonly class CredenciaisYoutubeMusicDTO
{
    public function __construct(
        #[SensitiveParameter]
        public string $cabecalhos,
    ) {
    }
}
