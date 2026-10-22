<?php

declare(strict_types=1);

namespace App\Service\Audio;

use App\Entity\Usuario;
use App\Exception\Audio\AudioException;
use App\Interface\ArmazenamentoInterface;
use App\Repository\AudioRepository;

final readonly class ApagarAudioService
{
    public function __construct(
        private AudioRepository $audioRepository,
        private ArmazenamentoInterface $armazenamento,
    ) {}

    public function executar(string $uuid, Usuario $usuario): void
    {
        $audio = $this->audioRepository->buscarDoUsuario($uuid, $usuario);
        if (null === $audio) {
            throw AudioException::audioNaoEncontrado();
        }

        if ($audio->isEmProcessamento()) {
            throw AudioException::audioEmProcessamento();
        }

        $this->armazenamento->remover((string) $audio->caminhoArquivo());
        $this->audioRepository->remover($audio);
    }
}
