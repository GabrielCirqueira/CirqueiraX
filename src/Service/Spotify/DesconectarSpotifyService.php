<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\Entity\Usuario;
use App\Enum\FonteReproducaoSpotify;
use App\Repository\ContaSpotifyRepository;
use App\Repository\ReproducaoSpotifyRepository;

final readonly class DesconectarSpotifyService
{
    public function __construct(
        private ContaSpotifyRepository $contaSpotifyRepository,
        private ReproducaoSpotifyRepository $reproducaoSpotifyRepository,
        private CacheAnaliseSpotifyService $cacheAnalise,
    ) {
    }

    public function executar(Usuario $usuario): int
    {
        $conta = $this->contaSpotifyRepository->buscarDoUsuario($usuario);
        if (null !== $conta) {
            $conta->desconectar();
            $this->contaSpotifyRepository->salvar($conta);
        }

        $removidas = $this->reproducaoSpotifyRepository->apagarPorUsuarioEFonte($usuario, FonteReproducaoSpotify::Api);
        $this->cacheAnalise->invalidar($usuario);

        return $removidas;
    }
}
