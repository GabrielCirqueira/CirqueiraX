<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\StatusSpotifyDTO;
use App\Entity\Usuario;
use App\Repository\ContaSpotifyRepository;

final readonly class ObterStatusSpotifyService
{
    public function __construct(
        private ContaSpotifyRepository $contaSpotifyRepository,
        private ControleLimiteSpotifyService $controleLimite,
    ) {
    }

    public function executar(Usuario $usuario): StatusSpotifyDTO
    {
        $conta = $this->contaSpotifyRepository->buscarDoUsuario($usuario);
        $bloqueio = null !== $conta && $conta->isConectada() ? $this->controleLimite->buscarBloqueioAtivo() : null;

        return new StatusSpotifyDTO($conta, $bloqueio);
    }
}
