<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\ExpirarAudiosTranscricaoMessage;
use App\Service\Transcricao\ExpirarAudiosTranscricaoService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class ExpirarAudiosTranscricaoMessageHandler
{
    public function __construct(
        private ExpirarAudiosTranscricaoService $expirarAudiosTranscricaoService,
    ) {}

    public function __invoke(ExpirarAudiosTranscricaoMessage $message): void
    {
        $this->expirarAudiosTranscricaoService->executar();
    }
}
