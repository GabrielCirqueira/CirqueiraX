<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic\Extensao;

use App\Entity\TokenExtensaoYoutubeMusic;
use App\Entity\Usuario;
use App\Repository\TokenExtensaoYoutubeMusicRepository;

final readonly class ListarTokensExtensaoYoutubeService
{
    public function __construct(
        private TokenExtensaoYoutubeMusicRepository $tokenRepository,
    ) {
    }

    /**
     * @return list<TokenExtensaoYoutubeMusic>
     */
    public function executar(Usuario $usuario): array
    {
        return $this->tokenRepository->listarAtivosDoUsuario($usuario);
    }
}
