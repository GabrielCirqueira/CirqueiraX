<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic\Extensao;

use App\Entity\Usuario;
use App\Exception\YoutubeMusic\ExtensaoYoutubeMusicException;
use App\Repository\TokenExtensaoYoutubeMusicRepository;
use Symfony\Component\Uid\Uuid;

final readonly class RevogarTokenExtensaoYoutubeService
{
    public function __construct(
        private TokenExtensaoYoutubeMusicRepository $tokenRepository,
    ) {
    }

    public function executar(Usuario $usuario, string $uuid): void
    {
        if (!Uuid::isValid($uuid)) {
            throw ExtensaoYoutubeMusicException::tokenNaoEncontrado();
        }

        $token = $this->tokenRepository->buscarAtivoDoUsuario($usuario, Uuid::fromString($uuid));
        if (null === $token) {
            throw ExtensaoYoutubeMusicException::tokenNaoEncontrado();
        }

        $this->tokenRepository->salvar($token->revogar());
    }
}
