<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\SincronizarVinculoPlaylistMessage;
use App\Service\TransferenciaPlaylist\SincronizarVinculoPlaylistService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class SincronizarVinculoPlaylistMessageHandler
{
    public function __construct(
        private SincronizarVinculoPlaylistService $sincronizarVinculo,
    ) {
    }

    public function __invoke(SincronizarVinculoPlaylistMessage $message): void
    {
        $this->sincronizarVinculo->executar($message->vinculoUuid, $message->force);
    }
}
