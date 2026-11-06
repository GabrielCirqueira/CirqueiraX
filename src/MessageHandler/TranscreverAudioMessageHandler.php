<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\TranscreverAudioMessage;
use App\Service\Transcricao\TranscreverAudioService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class TranscreverAudioMessageHandler
{
    public function __construct(
        private TranscreverAudioService $transcreverAudioService,
    ) {}

    public function __invoke(TranscreverAudioMessage $message): void
    {
        $this->transcreverAudioService->executar($message->transcricaoUuid);
    }
}
