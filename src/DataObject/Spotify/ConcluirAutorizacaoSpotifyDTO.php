<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class ConcluirAutorizacaoSpotifyDTO
{
    public function __construct(
        #[Assert\NotBlank(message: 'O código de autorização do Spotify é obrigatório.')]
        public string $code,
        #[Assert\NotBlank(message: 'O parâmetro state de segurança é obrigatório.')]
        public string $state,
    ) {
    }
}
