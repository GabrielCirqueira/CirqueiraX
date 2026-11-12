<?php

declare(strict_types=1);

namespace App\Serializer;

use App\Entity\TokenExtensaoYoutubeMusic;
use DateTimeInterface;

final class TokenExtensaoYoutubeMusicSerializer
{
    /**
     * @return array{uuid: string, nomeAparelho: string, criadoEm: string, ultimoUsoEm: ?string}
     */
    public function serializar(TokenExtensaoYoutubeMusic $token): array
    {
        return [
            'uuid' => $token->uuid()->toRfc4122(),
            'nomeAparelho' => $token->nomeAparelho(),
            'criadoEm' => $token->criadoEm()->format(DateTimeInterface::ATOM),
            'ultimoUsoEm' => $token->ultimoUsoEm()?->format(DateTimeInterface::ATOM),
        ];
    }

    /**
     * @param list<TokenExtensaoYoutubeMusic> $tokens
     *
     * @return list<array{uuid: string, nomeAparelho: string, criadoEm: string, ultimoUsoEm: ?string}>
     */
    public function serializarLista(array $tokens): array
    {
        return array_map($this->serializar(...), $tokens);
    }
}
