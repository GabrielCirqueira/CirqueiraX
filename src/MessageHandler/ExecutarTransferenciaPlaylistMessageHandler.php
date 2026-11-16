<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\ExecutarTransferenciaPlaylistMessage;
use App\Service\TransferenciaPlaylist\ExecutarTransferenciaPlaylistService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class ExecutarTransferenciaPlaylistMessageHandler
{
    public function __construct(
        private ExecutarTransferenciaPlaylistService $executarTransferencia,
    ) {
    }

    public function __invoke(ExecutarTransferenciaPlaylistMessage $message): void
    {
        $this->executarTransferencia->executar($message->transferenciaUuid);
    }
}
