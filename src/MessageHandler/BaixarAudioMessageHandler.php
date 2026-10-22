<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\BaixarAudioMessage;
use App\Service\Audio\BaixarAudioService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class BaixarAudioMessageHandler
{
    public function __construct(
        private BaixarAudioService $baixarAudioService,
    ) {}

    public function __invoke(BaixarAudioMessage $message): void
    {
        $this->baixarAudioService->executar($message->audioUuid());
    }
}
