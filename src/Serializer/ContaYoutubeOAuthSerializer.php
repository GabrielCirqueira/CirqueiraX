<?php

declare(strict_types=1);

namespace App\Serializer;

use App\Entity\ContaYoutubeOAuth;
use DateTimeInterface;

final class ContaYoutubeOAuthSerializer
{
    /**
     * @return array<string, mixed>
     */
    public function serializar(?ContaYoutubeOAuth $conta): array
    {
        if (null === $conta) {
            return [
                'conectada' => false,
                'email' => null,
                'nomeCanal' => null,
                'canalId' => null,
            ];
        }

        return [
            'conectada' => true,
            'email' => $conta->email(),
            'nomeCanal' => $conta->nomeCanal(),
            'canalId' => $conta->canalId(),
            'atualizadoEm' => $conta->atualizadoEm()->format(DateTimeInterface::ATOM),
        ];
    }
}
