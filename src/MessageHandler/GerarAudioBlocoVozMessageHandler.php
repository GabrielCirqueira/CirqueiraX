<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\GerarAudioBlocoVozMessage;
use App\Service\LivroAudio\FilaGeracaoLivrosAudioService;
use App\Service\LivroAudio\GerarAudioBlocoVozService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class GerarAudioBlocoVozMessageHandler
{
    public function __construct(
        private GerarAudioBlocoVozService $gerarAudioBlocoVozService,
        private FilaGeracaoLivrosAudioService $filaGeracao,
    ) {}

    public function __invoke(GerarAudioBlocoVozMessage $message): void
    {
        try {
            $this->gerarAudioBlocoVozService->executar($message->blocoVozUuid());
        } finally {
            $this->filaGeracao->reabastecer();
        }
    }
}
