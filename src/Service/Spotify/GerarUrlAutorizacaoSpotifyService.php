<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\Entity\Usuario;
use App\Interface\SpotifyInterface;

final readonly class GerarUrlAutorizacaoSpotifyService
{
    public const array ESCOPOS_PADRAO = [
        'user-read-recently-played',
        'user-read-currently-playing',
        'user-top-read',
    ];

    public function __construct(
        private SpotifyInterface $spotifyClient,
        private EstadoAutorizacaoSpotifyService $estadoAutorizacao,
    ) {
    }

    /**
     * @return array{url: string, state: string}
     */
    public function executar(Usuario $usuario): array
    {
        $state = $this->estadoAutorizacao->gerar($usuario);

        $url = $this->spotifyClient->gerarUrlAutorizacao($state, self::ESCOPOS_PADRAO);

        return [
            'url' => $url,
            'state' => $state,
        ];
    }
}
