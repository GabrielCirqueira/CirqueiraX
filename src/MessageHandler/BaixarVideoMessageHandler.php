<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\BaixarVideoMessage;
use App\Repository\UsuarioRepository;
use App\Service\Video\BaixarVideoService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class BaixarVideoMessageHandler
{
    public function __construct(
        private BaixarVideoService $baixarVideoService,
        private UsuarioRepository $usuarioRepository,
    ) {}

    public function __invoke(BaixarVideoMessage $message): void
    {
        $usuario = $this->usuarioRepository->find($message->usuarioId());
        if (null === $usuario) {
            return;
        }

        $this->baixarVideoService->executar(
            $usuario,
            $message->url(),
            $message->origem(),
            $message->categoriaId()
        );
    }
}
