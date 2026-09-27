<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\BaixarVideoMessage;
use App\Service\Video\BaixarVideoService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class BaixarVideoMessageHandler
{
    public function __construct(
        private BaixarVideoService $baixarVideoService,
    ) {}

    public function __invoke(BaixarVideoMessage $message): void
    {
        $this->baixarVideoService->executar($message->url());
    }
}
