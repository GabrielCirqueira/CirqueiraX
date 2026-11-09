<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\CorrigirTextoTranscricaoMessage;
use App\Service\Transcricao\CorrigirTextoTranscricaoService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class CorrigirTextoTranscricaoMessageHandler
{
    public function __construct(
        private CorrigirTextoTranscricaoService $corrigirTextoTranscricaoService,
    ) {}

    public function __invoke(CorrigirTextoTranscricaoMessage $message): void
    {
        $this->corrigirTextoTranscricaoService->executar($message->transcricaoUuid);
    }
}
