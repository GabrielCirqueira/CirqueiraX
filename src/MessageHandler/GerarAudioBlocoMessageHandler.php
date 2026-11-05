<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\GerarAudioBlocoMessage;
use App\Service\LivroAudio\GerarAudioBlocoService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class GerarAudioBlocoMessageHandler
{
    public function __construct(
        private GerarAudioBlocoService $gerarAudioBlocoService,
    ) {}

    public function __invoke(GerarAudioBlocoMessage $message): void
    {
        $this->gerarAudioBlocoService->executar();
    }
}
