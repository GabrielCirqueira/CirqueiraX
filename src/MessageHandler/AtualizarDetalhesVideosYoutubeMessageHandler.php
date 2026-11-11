<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\AtualizarDetalhesVideosYoutubeMessage;
use App\Service\YoutubeData\AtualizarDetalhesVencidosYoutubeService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class AtualizarDetalhesVideosYoutubeMessageHandler
{
    public function __construct(
        private AtualizarDetalhesVencidosYoutubeService $atualizarDetalhesVencidos,
    ) {
    }

    public function __invoke(AtualizarDetalhesVideosYoutubeMessage $message): void
    {
        $this->atualizarDetalhesVencidos->executar();
    }
}
