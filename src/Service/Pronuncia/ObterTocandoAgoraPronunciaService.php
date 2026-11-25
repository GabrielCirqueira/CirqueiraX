<?php

declare(strict_types=1);

namespace App\Service\Pronuncia;

use App\DataObject\Pronuncia\TocandoAgoraPronunciaDTO;
use App\Entity\Usuario;
use App\Repository\ContaSpotifyRepository;
use App\Service\Spotify\ObterTocandoAgoraSpotifyService;

final readonly class ObterTocandoAgoraPronunciaService
{
    public function __construct(
        private ContaSpotifyRepository $contaSpotifyRepository,
        private ObterTocandoAgoraSpotifyService $obterTocandoAgoraService,
    ) {
    }

    public function executar(Usuario $usuario): TocandoAgoraPronunciaDTO
    {
        $conta = $this->contaSpotifyRepository->buscarDoUsuario($usuario);
        $conectado = null !== $conta && $conta->isConectada();

        return new TocandoAgoraPronunciaDTO($conectado, $this->obterTocandoAgoraService->executar($usuario));
    }
}
