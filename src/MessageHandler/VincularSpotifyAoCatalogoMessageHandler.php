<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\VincularSpotifyAoCatalogoMessage;
use App\Repository\UsuarioRepository;
use App\Service\Musica\VincularFaixasSpotifyAoCatalogoService;
use DateTimeImmutable;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class VincularSpotifyAoCatalogoMessageHandler
{
    public function __construct(
        private VincularFaixasSpotifyAoCatalogoService $vincularFaixas,
        private UsuarioRepository $usuarioRepository,
    ) {
    }

    public function __invoke(VincularSpotifyAoCatalogoMessage $message): void
    {
        $usuario = $this->usuarioRepository->find($message->usuarioId);
        if (null === $usuario) {
            return;
        }

        $desde = null === $message->tocadasDesdeTimestamp ? null : (new DateTimeImmutable())->setTimestamp($message->tocadasDesdeTimestamp);
        $this->vincularFaixas->executar($usuario, $desde);
    }
}
