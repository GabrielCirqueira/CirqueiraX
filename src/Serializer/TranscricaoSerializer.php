<?php

declare(strict_types=1);

namespace App\Serializer;

use App\Entity\Transcricao;
use DateTimeInterface;

final readonly class TranscricaoSerializer
{
    /**
     * @return array<string, mixed>
     */
    public function normalizarResumo(Transcricao $transcricao): array
    {
        return [
            'uuid' => $transcricao->uuidTexto(),
            'titulo' => $transcricao->titulo(),
            'nomeArquivoOriginal' => $transcricao->nomeArquivoOriginal(),
            'mimeType' => $transcricao->mimeType(),
            'tamanhoBytes' => $transcricao->tamanhoBytes(),
            'duracaoSegundos' => $transcricao->duracaoSegundos(),
            'idiomaSolicitado' => $transcricao->idiomaSolicitado()->value,
            'idiomaDetectado' => $transcricao->idiomaDetectado(),
            'status' => $transcricao->status()->value,
            'statusDescricao' => $transcricao->status()->descricao(),
            'progresso' => $transcricao->progresso(),
            'previaTexto' => $transcricao->previaTexto(),
            'totalPalavras' => $transcricao->totalPalavras(),
            'erroMotivo' => $transcricao->erroMotivo(),
            'favorita' => $transcricao->isFavorita(),
            'origemVideo' => $transcricao->isOrigemVideo(),
            'statusCorrecao' => $transcricao->statusCorrecao()?->value,
            'statusCorrecaoDescricao' => $transcricao->statusCorrecao()?->descricao(),
            'erroCorrecao' => $transcricao->erroCorrecao(),
            'isCorrecaoEmAndamento' => $transcricao->isCorrecaoEmAndamento(),
            'isCorrigivel' => $transcricao->isCorrigivel(),
            'corrigidoEm' => $transcricao->corrigidoEm()?->format(DateTimeInterface::ATOM),
            'isEmAndamento' => $transcricao->isEmAndamento(),
            'isAudioDisponivel' => $transcricao->isAudioDisponivel(),
            'isReprocessavel' => $transcricao->isReprocessavel(),
            'isApagavel' => $transcricao->isApagavel(),
            'segundosRestantesEstimados' => $transcricao->segundosRestantesEstimados(),
            'segundosProcessamento' => $transcricao->segundosProcessamento(),
            'criadoEm' => $transcricao->criadoEm()->format(DateTimeInterface::ATOM),
            'atualizadoEm' => $transcricao->atualizadoEm()->format(DateTimeInterface::ATOM),
            'iniciadoEm' => $transcricao->iniciadoEm()?->format(DateTimeInterface::ATOM),
            'concluidoEm' => $transcricao->concluidoEm()?->format(DateTimeInterface::ATOM),
            'audioExpiraEm' => $transcricao->expiraAudioEm()?->format(DateTimeInterface::ATOM),
            'audioExpiradoEm' => $transcricao->audioExpiradoEm()?->format(DateTimeInterface::ATOM),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function normalizarDetalhe(Transcricao $transcricao): array
    {
        return [
            ...$this->normalizarResumo($transcricao),
            'texto' => $transcricao->texto(),
            'textoCorrigido' => $transcricao->textoCorrigido(),
            'segmentos' => $transcricao->segmentos(),
        ];
    }

    /**
     * @param list<Transcricao> $transcricoes
     *
     * @return list<array<string, mixed>>
     */
    public function normalizarLista(array $transcricoes): array
    {
        return array_map(fn (Transcricao $transcricao): array => $this->normalizarResumo($transcricao), $transcricoes);
    }
}
