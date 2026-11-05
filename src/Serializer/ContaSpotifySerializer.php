<?php

declare(strict_types=1);

namespace App\Serializer;

use App\Entity\ContaSpotify;

final class ContaSpotifySerializer
{
    /**
     * @return array<string, mixed>
     */
    public function serializar(?ContaSpotify $conta): array
    {
        if (null === $conta) {
            return [
                'conectada' => false,
                'status' => 'desconectada',
                'statusDescricao' => 'Desconectada',
                'spotifyId' => null,
                'nomeExibicao' => null,
                'urlFoto' => null,
                'conectadoEm' => null,
                'ultimaColetaEm' => null,
                'escopos' => null,
                'erroMotivo' => null,
            ];
        }

        return [
            'uuid' => $conta->uuid()->toRfc4122(),
            'conectada' => $conta->isConectada(),
            'status' => $conta->status()->value,
            'statusDescricao' => $conta->status()->descricao(),
            'spotifyId' => $conta->spotifyId(),
            'nomeExibicao' => $conta->nomeExibicao(),
            'urlFoto' => $conta->urlFoto(),
            'conectadoEm' => $conta->conectadoEm()?->format(\DateTimeInterface::ATOM),
            'ultimaColetaEm' => $conta->ultimaColetaEm()?->format(\DateTimeInterface::ATOM),
            'escopos' => $conta->escopos(),
            'erroMotivo' => $conta->erroMotivo(),
        ];
    }
}
