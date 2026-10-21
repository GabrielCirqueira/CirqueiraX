<?php

declare(strict_types=1);

namespace App\Serializer;

use App\Entity\RegistroEnvioGoogleFotos;
use DateTimeInterface;

final readonly class RegistroEnvioGoogleFotosSerializer
{
    /**
     * @return array<string, mixed>
     */
    public function normalizar(RegistroEnvioGoogleFotos $registro): array
    {
        return [
            'uuid' => $registro->uuid()->toString(),
            'mediaItemUuid' => $registro->mediaItemUuid(),
            'origemMidia' => $registro->origemMidia()->value,
            'origemMidiaDescricao' => $registro->origemMidia()->descricao(),
            'nomeArquivo' => $registro->nomeArquivo(),
            'tipoArquivo' => $registro->tipoArquivo(),
            'tamanhoBytes' => $registro->tamanhoBytes(),
            'dataMidia' => $registro->dataMidia()->format(DateTimeInterface::ATOM),
            'categoriaNome' => $registro->categoriaNome(),
            'albumId' => $registro->albumId(),
            'contaEmail' => $registro->contaEmail(),
            'status' => $registro->status()->value,
            'statusDescricao' => $registro->status()->descricao(),
            'origemEnvio' => $registro->origemEnvio()->value,
            'origemEnvioDescricao' => $registro->origemEnvio()->descricao(),
            'tentativa' => $registro->tentativa(),
            'googlePhotosMediaId' => $registro->googlePhotosMediaId(),
            'googlePhotosUrl' => $registro->googlePhotosUrl(),
            'erroMotivo' => $registro->erroMotivo(),
            'iniciadoEm' => $registro->iniciadoEm()->format(DateTimeInterface::ATOM),
            'finalizadoEm' => $registro->finalizadoEm()?->format(DateTimeInterface::ATOM),
            'duracaoMs' => $registro->duracaoMs(),
        ];
    }

    /**
     * @param list<RegistroEnvioGoogleFotos> $registros
     *
     * @return list<array<string, mixed>>
     */
    public function normalizarLista(array $registros): array
    {
        return array_map(
            fn(RegistroEnvioGoogleFotos $registro): array => $this->normalizar($registro),
            $registros,
        );
    }
}
