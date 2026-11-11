<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic;

use App\Entity\ContaYoutubeMusic;
use App\Entity\Usuario;
use App\Repository\ContaYoutubeMusicRepository;

final readonly class ObterStatusYoutubeMusicService
{
    public function __construct(
        private ContaYoutubeMusicRepository $contaRepository,
    ) {
    }

    public function executar(Usuario $usuario): ?ContaYoutubeMusic
    {
        return $this->contaRepository->buscarDoUsuario($usuario);
    }
}
