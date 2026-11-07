<?php

declare(strict_types=1);

namespace App\Service\Transcricao;

use App\DataObject\Transcricao\ReprocessarTranscricaoDTO;
use App\Entity\Transcricao;
use App\Entity\Usuario;
use App\Exception\Transcricao\TranscricaoException;
use App\Message\TranscreverAudioMessage;
use App\Repository\TranscricaoRepository;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class ReprocessarTranscricaoService
{
    public function __construct(
        private ConsultarTranscricoesService $consultarTranscricoesService,
        private TranscricaoRepository $transcricaoRepository,
        private MessageBusInterface $messageBus,
    ) {}

    public function executar(string $uuid, ReprocessarTranscricaoDTO $dto, Usuario $usuario): Transcricao
    {
        $transcricao = $this->consultarTranscricoesService->obterDoUsuario($uuid, $usuario);
        if (!$transcricao->isReprocessavel()) {
            throw TranscricaoException::naoPodeReprocessar();
        }

        $transcricao->prepararParaReprocessar($dto->idioma());
        $this->transcricaoRepository->flush();
        $this->messageBus->dispatch(new TranscreverAudioMessage($transcricao->uuidTexto()));

        return $transcricao;
    }
}
