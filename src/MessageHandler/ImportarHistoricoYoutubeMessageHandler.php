<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Enum\ResultadoEtapaImportacaoYoutube;
use App\Message\ImportarHistoricoYoutubeMessage;
use App\Service\YoutubeMusic\Importacao\ProcessarImportacaoYoutubeService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Messenger\Stamp\DelayStamp;

#[AsMessageHandler]
final readonly class ImportarHistoricoYoutubeMessageHandler
{
    private const int ESPERA_PARA_TENTAR_DE_NOVO_MS = 3600000;
    private const int ESPERA_PELA_VEZ_MS = 60000;

    public function __construct(
        private ProcessarImportacaoYoutubeService $processarService,
        private MessageBusInterface $messageBus,
    ) {
    }

    public function __invoke(ImportarHistoricoYoutubeMessage $message): void
    {
        $resultado = $this->processarService->executar($message->importacaoUuid);

        if (ResultadoEtapaImportacaoYoutube::Parar === $resultado) {
            return;
        }

        $espera = match ($resultado) {
            ResultadoEtapaImportacaoYoutube::Aguardar => self::ESPERA_PARA_TENTAR_DE_NOVO_MS,
            ResultadoEtapaImportacaoYoutube::AguardarVez => self::ESPERA_PELA_VEZ_MS,
            default => null,
        };
        $carimbos = null === $espera ? [] : [new DelayStamp($espera)];
        $this->messageBus->dispatch(new ImportarHistoricoYoutubeMessage($message->importacaoUuid), $carimbos);
    }
}
