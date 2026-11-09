<?php

declare(strict_types=1);

namespace App\Service\Transcricao;

use App\Entity\Transcricao;
use App\Entity\Usuario;
use App\Exception\Transcricao\TranscricaoException;
use App\Message\CorrigirTextoTranscricaoMessage;
use App\Repository\TranscricaoRepository;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class SolicitarCorrecaoTranscricaoService
{
    public function __construct(
        private ConsultarTranscricoesService $consultarTranscricoesService,
        private TranscricaoRepository $transcricaoRepository,
        private MessageBusInterface $messageBus,
    ) {}

    public function executar(string $uuid, Usuario $usuario): Transcricao
    {
        $transcricao = $this->consultarTranscricoesService->obterDoUsuario($uuid, $usuario);
        if (!$transcricao->isCorrigivel()) {
            throw TranscricaoException::naoPodeCorrigir();
        }

        $transcricao->solicitarCorrecao();
        $this->transcricaoRepository->flush();
        $this->messageBus->dispatch(new CorrigirTextoTranscricaoMessage($transcricao->uuidTexto()));

        return $transcricao;
    }
}
