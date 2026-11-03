<?php

declare(strict_types=1);

namespace App\Serializer;

use App\Entity\LivroAudioBloco;
use DateTimeInterface;

final readonly class LivroAudioBlocoSerializer
{
    /**
     * @return array<string, mixed>
     */
    public function normalizar(LivroAudioBloco $bloco): array
    {
        return [
            'uuid' => $bloco->uuidTexto(),
            'numeroBloco' => $bloco->numeroBloco(),
            'paginaInicio' => $bloco->paginaInicio(),
            'paginaFim' => $bloco->paginaFim(),
            'duracaoSegundos' => $bloco->duracaoSegundos(),
            'tamanhoBytes' => $bloco->tamanhoBytes(),
            'status' => $bloco->status()->value,
            'statusDescricao' => $bloco->status()->descricao(),
            'isPronto' => $bloco->isPronto(),
            'isGerando' => $bloco->isGerando(),
            'isPendente' => $bloco->isPendente(),
            'isErro' => $bloco->isErro(),
            'possuiTrechos' => $bloco->possuiTrechos(),
            'erroMotivo' => $bloco->erroMotivo(),
            'criadoEm' => $bloco->criadoEm()->format(DateTimeInterface::ATOM),
            'atualizadoEm' => $bloco->atualizadoEm()->format(DateTimeInterface::ATOM),
        ];
    }

    /**
     * @param list<LivroAudioBloco> $blocos
     *
     * @return list<array<string, mixed>>
     */
    public function normalizarLista(array $blocos): array
    {
        return array_map(fn(LivroAudioBloco $bloco): array => $this->normalizar($bloco), $blocos);
    }
}
