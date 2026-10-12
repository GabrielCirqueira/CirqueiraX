<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\LimparVideosAntigosMessage;
use App\Service\MediaItem\LimparVideosAntigosService;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class LimparVideosAntigosMessageHandler
{
    public function __construct(
        private LimparVideosAntigosService $limparVideosAntigosService,
        private ?LoggerInterface $logger = null,
    ) {}

    public function __invoke(LimparVideosAntigosMessage $message): void
    {
        $this->logger?->info('Iniciando rotina de expurgo de vídeos antigos via Messenger/Scheduler', [
            'dias' => $message->dias(),
        ]);

        $resultado = $this->limparVideosAntigosService->executar($message->dias(), false);

        $this->logger?->info('Rotina de expurgo de vídeos antigos finalizada', [
            'totalAnalisados' => $resultado['totalAnalisados'],
            'totalExpurgados' => $resultado['totalExpurgados'],
            'espacoLiberado' => $resultado['espacoLiberadoFormatado'],
            'erros' => count($resultado['erros']),
        ]);
    }
}
