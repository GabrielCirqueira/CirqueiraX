<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\CasarFaixasTransferenciaMessage;
use App\Service\TransferenciaPlaylist\CasarFaixasTransferenciaService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class CasarFaixasTransferenciaMessageHandler
{
    public function __construct(
        private CasarFaixasTransferenciaService $casarFaixas,
    ) {
    }

    public function __invoke(CasarFaixasTransferenciaMessage $message): void
    {
        $this->casarFaixas->executar($message->transferenciaUuid);
    }
}
