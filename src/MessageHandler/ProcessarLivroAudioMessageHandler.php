<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\ProcessarLivroAudioMessage;
use App\Service\LivroAudio\ProcessarLivroAudioService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class ProcessarLivroAudioMessageHandler
{
    public function __construct(
        private ProcessarLivroAudioService $processarLivroAudioService,
    ) {}

    public function __invoke(ProcessarLivroAudioMessage $message): void
    {
        $this->processarLivroAudioService->executar($message->livroUuid());
    }
}
