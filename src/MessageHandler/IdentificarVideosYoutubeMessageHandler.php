<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\IdentificarVideosYoutubeMessage;
use App\Service\IdentificacaoMusica\IdentificarPendentesYoutubeService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class IdentificarVideosYoutubeMessageHandler
{
    public function __construct(
        private IdentificarPendentesYoutubeService $identificarPendentes,
    ) {
    }

    public function __invoke(IdentificarVideosYoutubeMessage $message): void
    {
        $this->identificarPendentes->executar();
    }
}
