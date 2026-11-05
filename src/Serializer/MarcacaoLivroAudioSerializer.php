<?php

declare(strict_types=1);

namespace App\Serializer;

use App\Entity\MarcacaoLivroAudio;
use DateTimeInterface;

final readonly class MarcacaoLivroAudioSerializer
{
    /**
     * @return array<string, mixed>
     */
    public function normalizar(MarcacaoLivroAudio $marcacao): array
    {
        return [
            'uuid' => $marcacao->uuidTexto(),
            'tipo' => $marcacao->tipo()->value,
            'tipoDescricao' => $marcacao->tipo()->descricao(),
            'pagina' => $marcacao->pagina(),
            'numeroBloco' => $marcacao->numeroBloco(),
            'indiceTrecho' => $marcacao->indiceTrecho(),
            'segundos' => $marcacao->segundos(),
            'texto' => $marcacao->texto(),
            'nota' => $marcacao->nota(),
            'retangulos' => $marcacao->retangulos(),
            'criadoEm' => $marcacao->criadoEm()->format(DateTimeInterface::ATOM),
            'atualizadoEm' => $marcacao->atualizadoEm()->format(DateTimeInterface::ATOM),
        ];
    }

    /**
     * @param list<MarcacaoLivroAudio> $marcacoes
     *
     * @return list<array<string, mixed>>
     */
    public function normalizarLista(array $marcacoes): array
    {
        return array_map(fn(MarcacaoLivroAudio $marcacao): array => $this->normalizar($marcacao), $marcacoes);
    }
}
