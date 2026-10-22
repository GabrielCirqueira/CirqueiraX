<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\ExpirarAudiosAntigosMessage;
use App\Service\Audio\ExpirarAudiosAntigosService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class ExpirarAudiosAntigosMessageHandler
{
    public function __construct(
        private ExpirarAudiosAntigosService $expirarAudiosAntigosService,
    ) {}

    public function __invoke(ExpirarAudiosAntigosMessage $message): void
    {
        $this->expirarAudiosAntigosService->executar();
    }
}
