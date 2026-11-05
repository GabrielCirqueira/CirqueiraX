<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\ImportarHistoricoSpotifyMessage;
use App\Service\Spotify\ProcessarArquivoImportacaoSpotifyService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class ImportarHistoricoSpotifyMessageHandler
{
    public function __construct(
        private ProcessarArquivoImportacaoSpotifyService $processarService,
    ) {}

    public function __invoke(ImportarHistoricoSpotifyMessage $message): void
    {
        $this->processarService->executar($message->importacaoUuid());
    }
}
