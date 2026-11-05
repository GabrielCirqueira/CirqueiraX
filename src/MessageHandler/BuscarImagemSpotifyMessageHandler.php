<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\BuscarImagemSpotifyMessage;
use App\Service\Spotify\ResolverImagemSpotifyService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class BuscarImagemSpotifyMessageHandler
{
    public function __construct(
        private ResolverImagemSpotifyService $resolverImagemService,
    ) {
    }

    public function __invoke(BuscarImagemSpotifyMessage $message): void
    {
        $this->resolverImagemService->executar($message);
    }
}

