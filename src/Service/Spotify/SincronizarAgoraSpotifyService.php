<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\ResultadoColetaHistoricoSpotifyDTO;
use App\Entity\Usuario;
use App\Exception\Spotify\SpotifyException;
use App\Repository\ContaSpotifyRepository;

final readonly class SincronizarAgoraSpotifyService
{
    public function __construct(
        private ContaSpotifyRepository $contaSpotifyRepository,
        private ColetarHistoricoRecenteSpotifyService $coletarHistoricoRecenteSpotifyService,
    ) {
    }

    public function executar(Usuario $usuario): ResultadoColetaHistoricoSpotifyDTO
    {
        $conta = $this->contaSpotifyRepository->buscarDoUsuario($usuario);
        if (null === $conta || !$conta->isConectada()) {
            throw SpotifyException::contaNaoConectada();
        }

        return $this->coletarHistoricoRecenteSpotifyService->executarParaConta($conta);
    }
}
