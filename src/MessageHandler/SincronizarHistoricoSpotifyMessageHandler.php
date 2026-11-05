<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\SincronizarHistoricoSpotifyMessage;
use App\Repository\ContaSpotifyRepository;
use App\Service\Spotify\ColetarHistoricoRecenteSpotifyService;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Uid\Uuid;

#[AsMessageHandler]
final readonly class SincronizarHistoricoSpotifyMessageHandler
{
    public function __construct(
        private ColetarHistoricoRecenteSpotifyService $coletarHistoricoRecenteSpotifyService,
        private ContaSpotifyRepository $contaSpotifyRepository,
        private LoggerInterface $logger,
    ) {
    }

    public function __invoke(SincronizarHistoricoSpotifyMessage $message): void
    {
        if (null !== $message->contaUuid && '' !== trim($message->contaUuid)) {
            $conta = $this->contaSpotifyRepository->find(Uuid::fromString($message->contaUuid));
            if (null === $conta || !$conta->isConectada()) {
                $this->logger->info('Coleta do Spotify ignorada: conta não encontrada ou não conectada.', [
                    'contaUuid' => $message->contaUuid,
                ]);

                return;
            }

            $resultado = $this->coletarHistoricoRecenteSpotifyService->executarParaConta($conta);
            $this->logger->info('Coleta individual do histórico Spotify concluída.', [
                'contaUuid' => $message->contaUuid,
                'totalColetadas' => $resultado->totalColetadas,
                'totalNovas' => $resultado->totalNovas,
                'totalDuplicadas' => $resultado->totalDuplicadas,
            ]);

            return;
        }

        $resultados = $this->coletarHistoricoRecenteSpotifyService->executarParaTodasContasConectadas();
        $this->logger->info('Rotina agendada de coleta do Spotify concluída.', [
            'totalContasProcessadas' => count($resultados),
        ]);
    }
}

