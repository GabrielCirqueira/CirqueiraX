<?php

declare(strict_types=1);

namespace App\DataObject\TransferenciaPlaylist;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class ConcluirAutorizacaoYoutubeOAuthDTO
{
    public function __construct(
        #[Assert\NotBlank]
        public string $code,
    ) {
    }
}
