<?php

declare(strict_types=1);

namespace App\Serializer;

use App\Entity\LivroAudio;
use DateTimeInterface;

final readonly class LivroAudioSerializer
{
    /**
     * @return array<string, mixed>
     */
    public function normalizar(LivroAudio $livro): array
    {
        return [
            'uuid' => $livro->uuidTexto(),
            'titulo' => $livro->titulo(),
            'totalPaginas' => $livro->totalPaginas(),
            'tamanhoBytes' => $livro->tamanhoBytes(),
            'status' => $livro->status()->value,
            'statusDescricao' => $livro->status()->descricao(),
            'erroMotivo' => $livro->erroMotivo(),
            'criadoEm' => $livro->criadoEm()->format(DateTimeInterface::ATOM),
            'atualizadoEm' => $livro->atualizadoEm()->format(DateTimeInterface::ATOM),
            'isEnviado' => $livro->isEnviado(),
            'isExtraindo' => $livro->isExtraindo(),
            'isGerandoAudio' => $livro->isGerandoAudio(),
            'isParcial' => $livro->isParcial(),
            'isPronto' => $livro->isPronto(),
            'isErro' => $livro->isErro(),
            'isEmProcessamento' => $livro->isEmProcessamento(),
            'isDisponivelParaOuvir' => $livro->isDisponivelParaOuvir(),
        ];
    }

    /**
     * @param list<LivroAudio> $livros
     *
     * @return list<array<string, mixed>>
     */
    public function normalizarLista(array $livros): array
    {
        return array_map(fn(LivroAudio $livro): array => $this->normalizar($livro), $livros);
    }
}
