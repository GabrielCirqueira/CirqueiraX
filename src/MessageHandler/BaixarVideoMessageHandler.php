<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\DataObject\IngestarMediaDTO;
use App\Message\BaixarVideoMessage;
use App\Service\BaixarVideoDownloadService;
use App\Service\IngestarMediaService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class BaixarVideoMessageHandler
{
    public function __construct(
        private BaixarVideoDownloadService $downloadService,
        private IngestarMediaService $ingestarMediaService,
    ) {
    }

    public function __invoke(BaixarVideoMessage $message): void
    {
        $resultado = $this->downloadService->executar($message->url());

        $ingestarDTO = new IngestarMediaDTO(
            caminhoArquivo: $resultado['caminho_arquivo'],
            origem: $message->origem(),
            metadata: $resultado['metadata'],
        );

        $this->ingestarMediaService->executar($ingestarDTO);
    }
}
