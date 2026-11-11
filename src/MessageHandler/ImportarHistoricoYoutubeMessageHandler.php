<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\ImportarHistoricoYoutubeMessage;
use App\Service\YoutubeMusic\Importacao\ProcessarImportacaoYoutubeService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class ImportarHistoricoYoutubeMessageHandler
{
    public function __construct(
        private ProcessarImportacaoYoutubeService $processarService,
    ) {
    }

    public function __invoke(ImportarHistoricoYoutubeMessage $message): void
    {
        $this->processarService->executar($message->importacaoUuid);
    }
}
