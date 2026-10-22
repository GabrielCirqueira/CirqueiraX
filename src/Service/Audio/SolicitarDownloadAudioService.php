<?php

declare(strict_types=1);

namespace App\Service\Audio;

use App\DataObject\SolicitarDownloadAudioDTO;
use App\Entity\Audio;
use App\Entity\Usuario;
use App\Exception\Audio\AudioException;
use App\Message\BaixarAudioMessage;
use App\Repository\AudioRepository;
use App\Service\Video\ValidadorUrlPlataforma;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class SolicitarDownloadAudioService
{
    public function __construct(
        private AudioRepository $audioRepository,
        private ValidadorUrlPlataforma $validadorUrl,
        private MessageBusInterface $messageBus,
    ) {}

    public function solicitar(SolicitarDownloadAudioDTO $dto, Usuario $usuario): Audio
    {
        if (!$this->validadorUrl->ehUrlSuportada($dto->url())) {
            throw AudioException::urlNaoSuportada($dto->url());
        }

        return $this->enfileirar(new Audio($usuario, $dto->url()));
    }

    public function rebaixar(string $uuid, Usuario $usuario): Audio
    {
        $audio = $this->audioRepository->buscarDoUsuario($uuid, $usuario);
        if (null === $audio) {
            throw AudioException::audioNaoEncontrado();
        }

        if (!$audio->isRebaixavel()) {
            throw AudioException::audioNaoPodeSerRebaixado();
        }

        return $this->enfileirar($audio->prepararParaRebaixar());
    }

    private function enfileirar(Audio $audio): Audio
    {
        $this->audioRepository->salvar($audio);
        $this->messageBus->dispatch(new BaixarAudioMessage($audio->uuidTexto()));

        return $audio;
    }
}
