<?php

declare(strict_types=1);

namespace App\Service\GoogleFotos;

use App\Entity\RegistroEnvioGoogleFotos;
use App\Exception\GoogleFotos\RegistroEnvioGoogleFotosException;
use App\Exception\MediaItem\MediaItemException;
use App\Message\EnviarGoogleFotosMessage;
use App\Repository\MediaItemRepository;
use App\Repository\RegistroEnvioGoogleFotosRepository;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class ReenviarGoogleFotosService
{
    public function __construct(
        private RegistroEnvioGoogleFotosRepository $registroRepository,
        private MediaItemRepository $mediaItemRepository,
        private MessageBusInterface $messageBus,
    ) {}

    public function reenviar(string $registroUuid): RegistroEnvioGoogleFotos
    {
        $registro = $this->registroRepository->buscarPorUuid($registroUuid);
        if (null === $registro) {
            throw RegistroEnvioGoogleFotosException::registroNaoEncontrado();
        }

        $mediaItem = $this->mediaItemRepository->buscarPorUuid($registro->mediaItemUuid());
        if (null === $mediaItem) {
            throw MediaItemException::midiaNaoEncontradaPorUuid();
        }

        if ($mediaItem->isEnviadoGoogleFotos()) {
            throw RegistroEnvioGoogleFotosException::midiaJaEnviada();
        }

        $this->messageBus->dispatch(new EnviarGoogleFotosMessage($registro->mediaItemUuid(), reenvioManual: true));

        return $registro;
    }
}
