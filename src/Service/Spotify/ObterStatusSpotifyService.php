<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\Entity\ContaSpotify;
use App\Entity\Usuario;
use App\Repository\ContaSpotifyRepository;

final readonly class ObterStatusSpotifyService
{
    public function __construct(
        private ContaSpotifyRepository $contaSpotifyRepository,
    ) {
    }

    public function executar(Usuario $usuario): ?ContaSpotify
    {
        return $this->contaSpotifyRepository->buscarDoUsuario($usuario);
    }
}
