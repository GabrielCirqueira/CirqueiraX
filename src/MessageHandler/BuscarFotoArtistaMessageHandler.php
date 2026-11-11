<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\BuscarFotoArtistaMessage;
use App\Repository\UsuarioRepository;
use App\Service\Musica\BuscarFotoArtistaCatalogoService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class BuscarFotoArtistaMessageHandler
{
    public function __construct(
        private BuscarFotoArtistaCatalogoService $buscarFoto,
        private UsuarioRepository $usuarioRepository,
    ) {
    }

    public function __invoke(BuscarFotoArtistaMessage $message): void
    {
        $usuario = $this->usuarioRepository->find($message->usuarioId);
        if (null === $usuario) {
            return;
        }

        $this->buscarFoto->executar($usuario, $message->artistaUuid);
    }
}
