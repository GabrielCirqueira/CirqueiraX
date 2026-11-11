<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\VincularSpotifyAoCatalogoMessage;
use App\Repository\UsuarioRepository;
use App\Service\Musica\Projecao\ProjetarReproducoesSpotifyService;
use App\Service\Musica\VincularFaixasSpotifyAoCatalogoService;
use DateTimeImmutable;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class VincularSpotifyAoCatalogoMessageHandler
{
    public function __construct(
        private VincularFaixasSpotifyAoCatalogoService $vincularFaixas,
        private UsuarioRepository $usuarioRepository,
        private ProjetarReproducoesSpotifyService $projetarSpotify,
    ) {
    }

    public function __invoke(VincularSpotifyAoCatalogoMessage $message): void
    {
        $usuario = $this->usuarioRepository->find($message->usuarioId);
        if (null === $usuario) {
            return;
        }

        $desde = null === $message->tocadasDesdeTimestamp ? null : (new DateTimeImmutable())->setTimestamp($message->tocadasDesdeTimestamp);
        $ate = null === $message->tocadasAteTimestamp ? null : (new DateTimeImmutable())->setTimestamp($message->tocadasAteTimestamp);
        $this->vincularFaixas->executar($usuario, $desde);
        $this->projetarSpotify->executar($this->usuarioRepository->find($message->usuarioId) ?? $usuario, $desde, $ate);
    }
}
