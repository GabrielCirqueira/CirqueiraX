<?php

declare(strict_types=1);

namespace App\Service\YoutubeOAuth;

use App\Entity\Usuario;
use App\Repository\ContaYoutubeOAuthRepository;

final readonly class DesconectarYoutubeOAuthService
{
    public function __construct(
        private ContaYoutubeOAuthRepository $contaRepository,
    ) {
    }

    public function executar(Usuario $usuario): void
    {
        $conta = $this->contaRepository->buscarDoUsuario($usuario);
        if (null === $conta) {
            return;
        }

        $this->contaRepository->remover($conta);
    }
}
