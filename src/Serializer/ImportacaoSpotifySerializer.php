<?php

declare(strict_types=1);

namespace App\Serializer;

use App\Entity\ImportacaoSpotify;

final readonly class ImportacaoSpotifySerializer
{
    /**
     * @return array<string, mixed>
     */
    public function serializar(ImportacaoSpotify $importacao): array
    {
        return [
            'uuid' => $importacao->uuid()->toRfc4122(),
            'status' => $importacao->status()->value,
            'statusDescricao' => $importacao->status()->descricao(),
            'nomeArquivoOriginal' => $importacao->nomeArquivoOriginal(),
            'tamanhoBytes' => $importacao->tamanhoBytes(),
            'totalLidos' => $importacao->totalLidos(),
            'totalNovos' => $importacao->totalNovos(),
            'totalIgnorados' => $importacao->totalIgnorados(),
            'totalSubstituidos' => $importacao->totalSubstituidos(),
            'erroMotivo' => $importacao->erroMotivo(),
            'criadoEm' => $importacao->criadoEm()->format(\DateTimeInterface::ATOM),
            'iniciadoEm' => $importacao->iniciadoEm()?->format(\DateTimeInterface::ATOM),
            'concluidoEm' => $importacao->concluidoEm()?->format(\DateTimeInterface::ATOM),
            'isEmAndamento' => $importacao->isEmAndamento(),
            'isFinalizada' => $importacao->isFinalizada(),
        ];
    }
}
