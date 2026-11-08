<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\SincronizarArtistasFaixasSpotifyMessage;
use App\Service\Spotify\SincronizarArtistasFaixasSpotifyService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class SincronizarArtistasFaixasSpotifyMessageHandler
{
    public function __construct(
        private SincronizarArtistasFaixasSpotifyService $sincronizarArtistasFaixasService,
    ) {
    }

    public function __invoke(SincronizarArtistasFaixasSpotifyMessage $message): void
    {
        $this->sincronizarArtistasFaixasService->executarParaTodasContasConectadas();
    }
}
