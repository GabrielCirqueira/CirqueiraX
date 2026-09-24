<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\DistribuirLocalMessage;
use App\Service\DistribuirLocalService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class DistribuirLocalMessageHandler
{
    public function __construct(
        private DistribuirLocalService $distribuirLocalService,
    ) {
    }

    public function __invoke(DistribuirLocalMessage $message): void
    {
        $this->distribuirLocalService->executar($message->mediaItemUuid());
    }
}
