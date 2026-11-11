<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\ColetarHistoricoYoutubeMusicMessage;
use App\Service\YoutubeMusic\ColetarHistoricoYoutubeMusicService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class ColetarHistoricoYoutubeMusicMessageHandler
{
    public function __construct(
        private ColetarHistoricoYoutubeMusicService $coletarHistorico,
    ) {
    }

    public function __invoke(ColetarHistoricoYoutubeMusicMessage $message): void
    {
        $this->coletarHistorico->executarContasVencidas();
    }
}
