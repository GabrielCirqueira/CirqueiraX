<?php

declare(strict_types=1);

namespace App\Service\YoutubeOAuth;

use App\Entity\ContaYoutubeOAuth;
use App\Entity\Usuario;
use App\Repository\ContaYoutubeOAuthRepository;

final readonly class ObterStatusYoutubeOAuthService
{
    public function __construct(
        private ContaYoutubeOAuthRepository $contaRepository,
    ) {
    }

    public function executar(Usuario $usuario): ?ContaYoutubeOAuth
    {
        return $this->contaRepository->buscarDoUsuario($usuario);
    }
}
