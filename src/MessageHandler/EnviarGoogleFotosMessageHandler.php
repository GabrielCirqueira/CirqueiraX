<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\EnviarGoogleFotosMessage;
use App\Service\EnviarGoogleFotosService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class EnviarGoogleFotosMessageHandler
{
    public function __construct(
        private EnviarGoogleFotosService $enviarGoogleFotosService,
    ) {
    }

    public function __invoke(EnviarGoogleFotosMessage $message): void
    {
        $this->enviarGoogleFotosService->executar($message->mediaItemUuid());
    }
}
