<?php

declare(strict_types=1);

namespace App\Security;

use App\Entity\TokenExtensaoYoutubeMusic;
use App\Entity\Usuario;
use Symfony\Component\Security\Core\User\UserInterface;

final readonly class ExtensaoYoutubeMusicUser implements UserInterface
{
    public const string PAPEL = 'ROLE_EXTENSAO_YOUTUBE_MUSIC';

    public function __construct(
        private TokenExtensaoYoutubeMusic $token,
    ) {
    }

    public function token(): TokenExtensaoYoutubeMusic
    {
        return $this->token;
    }

    public function usuario(): Usuario
    {
        return $this->token->usuario();
    }

    public function getUserIdentifier(): string
    {
        return $this->token->uuid()->toRfc4122();
    }

    /**
     * @return list<string>
     */
    public function getRoles(): array
    {
        return [self::PAPEL];
    }

    public function eraseCredentials(): void
    {
    }
}
