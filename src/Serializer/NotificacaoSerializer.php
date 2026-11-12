<?php

declare(strict_types=1);

namespace App\Serializer;

use App\Entity\Notificacao;
use DateTimeInterface;

final readonly class NotificacaoSerializer
{
    /**
     * @param list<Notificacao> $notificacoes
     *
     * @return array{itens: list<array<string, mixed>>, naoLidas: int}
     */
    public function serializarLista(array $notificacoes, int $naoLidas): array
    {
        return [
            'itens' => array_map(fn (Notificacao $notificacao): array => $this->serializar($notificacao), $notificacoes),
            'naoLidas' => $naoLidas,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function serializar(Notificacao $notificacao): array
    {
        return [
            'uuid' => $notificacao->uuid()->toRfc4122(),
            'tipo' => $notificacao->tipo()->value,
            'tipoDescricao' => $notificacao->tipo()->descricao(),
            'titulo' => $notificacao->titulo(),
            'mensagem' => $notificacao->mensagem(),
            'lida' => $notificacao->isLida(),
            'lidaEm' => $notificacao->lidaEm()?->format(DateTimeInterface::ATOM),
            'criadoEm' => $notificacao->criadoEm()->format(DateTimeInterface::ATOM),
        ];
    }
}
