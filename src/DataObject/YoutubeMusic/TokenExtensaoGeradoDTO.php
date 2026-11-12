<?php

declare(strict_types=1);

namespace App\DataObject\YoutubeMusic;

use App\Entity\TokenExtensaoYoutubeMusic;
use SensitiveParameter;

final readonly class TokenExtensaoGeradoDTO
{
    public function __construct(
        public TokenExtensaoYoutubeMusic $token,
        #[SensitiveParameter]
        public string $textoToken,
    ) {
    }
}
