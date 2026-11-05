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
            'paginaAtual' => $livro->paginaAtual(),
            'blocoAtual' => $livro->blocoAtual(),
            'segundosNoBloco' => $livro->segundosNoBloco(),
            'tamanhoBytes' => $livro->tamanhoBytes(),
            'tamanhoTotalBytes' => $livro->tamanhoTotalBytes(),
            'idioma' => $livro->idioma()?->value,
            'idiomaDescricao' => $livro->idioma()?->descricao(),
            'totalBlocos' => $livro->totalBlocos(),
            'blocosProntos' => $livro->blocosProntos(),
            'blocosComErro' => $livro->blocosComErro(),
            'segundosAudioProntos' => $livro->segundosAudioProntos(),
            'temAudioParaOuvir' => $livro->temAudioParaOuvir(),
            'modoNotas' => $livro->modoNotas()->value,
            'modoNotasDescricao' => $livro->modoNotas()->descricao(),
            'pronuncias' => $livro->pronuncias(),
            'narracaoDesatualizada' => $livro->narracaoDesatualizada(),
            'status' => $livro->status()->value,
            'statusDescricao' => $livro->status()->descricao(),
            'erroMotivo' => $livro->erroMotivo(),
            'criadoEm' => $livro->criadoEm()->format(DateTimeInterface::ATOM),
            'atualizadoEm' => $livro->atualizadoEm()->format(DateTimeInterface::ATOM),
            'ultimaEscutaEm' => $livro->ultimaEscutaEm()?->format(DateTimeInterface::ATOM),
            'filaPausada' => $livro->isFilaPausada(),
            'prioridadeFila' => $livro->prioridadeFila(),
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
