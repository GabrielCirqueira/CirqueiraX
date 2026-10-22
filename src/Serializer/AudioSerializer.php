<?php

declare(strict_types=1);

namespace App\Serializer;

use App\Entity\Audio;
use DateTimeInterface;

final readonly class AudioSerializer
{
    /**
     * @return array<string, mixed>
     */
    public function normalizar(Audio $audio): array
    {
        return [
            'uuid' => $audio->uuidTexto(),
            'url' => $audio->url(),
            'status' => $audio->status()->value,
            'statusDescricao' => $audio->status()->descricao(),
            'titulo' => $audio->titulo(),
            'autor' => $audio->autor(),
            'duracaoSegundos' => $audio->duracaoSegundos(),
            'thumbnailUrl' => $audio->thumbnailUrl(),
            'tamanhoBytes' => $audio->tamanhoBytes(),
            'erroMotivo' => $audio->erroMotivo(),
            'isDisponivel' => $audio->isDisponivel(),
            'isRebaixavel' => $audio->isRebaixavel(),
            'isEmProcessamento' => $audio->isEmProcessamento(),
            'criadoEm' => $audio->criadoEm()->format(DateTimeInterface::ATOM),
            'baixadoEm' => $audio->baixadoEm()?->format(DateTimeInterface::ATOM),
            'expiraEm' => $audio->expiraEm()?->format(DateTimeInterface::ATOM),
            'expiradoEm' => $audio->expiradoEm()?->format(DateTimeInterface::ATOM),
        ];
    }

    /**
     * @param list<Audio> $audios
     *
     * @return list<array<string, mixed>>
     */
    public function normalizarLista(array $audios): array
    {
        return array_map(fn(Audio $audio): array => $this->normalizar($audio), $audios);
    }
}
