<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic;

use App\Entity\Usuario;
use App\Exception\YoutubeMusic\YoutubeMusicException;
use App\Repository\ContaYoutubeMusicRepository;

final readonly class DesconectarYoutubeMusicService
{
    public function __construct(
        private ContaYoutubeMusicRepository $contaRepository,
    ) {
    }

    public function executar(Usuario $usuario): void
    {
        $conta = $this->contaRepository->buscarDoUsuario($usuario);
        if (null === $conta) {
            throw YoutubeMusicException::contaNaoConectada();
        }

        $conta->desconectar();
        $this->contaRepository->salvar($conta);
    }
}
