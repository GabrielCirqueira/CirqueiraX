<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class TocarFaixaSpotifyDTO
{
    public function __construct(
        #[Assert\NotBlank(message: 'Informe a faixa do Spotify.')]
        #[Assert\Regex(pattern: '/^[A-Za-z0-9]{22}$/', message: 'Código de faixa do Spotify inválido.')]
        public string $codigoFaixa,
    ) {
    }
}
