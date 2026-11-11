<?php

declare(strict_types=1);

namespace App\Serializer;

use App\Entity\ImportacaoYoutube;
use DateTimeInterface;

final readonly class ImportacaoYoutubeSerializer
{
    /**
     * @return array<string, mixed>
     */
    public function serializar(ImportacaoYoutube $importacao): array
    {
        return [
            'uuid' => $importacao->uuid()->toRfc4122(),
            'status' => $importacao->status()->value,
            'statusDescricao' => $importacao->status()->descricao(),
            'nomeArquivoOriginal' => $importacao->nomeArquivoOriginal(),
            'tamanhoBytes' => $importacao->tamanhoBytes(),
            'totalLidos' => $importacao->totalLidos(),
            'totalDescartados' => $importacao->totalDescartados(),
            'totalNovos' => $importacao->totalNovos(),
            'totalIgnorados' => $importacao->totalIgnorados(),
            'totalUnificados' => $importacao->totalUnificados(),
            'totalVideosNovos' => $importacao->totalVideosNovos(),
            'erroMotivo' => $importacao->erroMotivo(),
            'criadoEm' => $importacao->criadoEm()->format(DateTimeInterface::ATOM),
            'iniciadoEm' => $importacao->iniciadoEm()?->format(DateTimeInterface::ATOM),
            'concluidoEm' => $importacao->concluidoEm()?->format(DateTimeInterface::ATOM),
            'isFinalizada' => $importacao->isFinalizada(),
        ];
    }
}
