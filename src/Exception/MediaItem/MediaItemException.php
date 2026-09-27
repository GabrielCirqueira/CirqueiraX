<?php

declare(strict_types=1);

namespace App\Exception\MediaItem;

class MediaItemException extends \DomainException
{
    public static function midiaNaoEncontradaPorUuid(): self
    {
        return new self('Nenhuma mídia foi encontrada com o UUID informado.', 404);
    }

    public static function categoriaDesejadaNaoDefinida(): self
    {
        return new self('A categoria desejada para a mídia não foi especificada.', 400);
    }

    public static function arquivoDeOrigemNaoEncontrado(): self
    {
        return new self('O arquivo físico de origem da mídia não foi localizado no sistema.', 404);
    }

    public static function transicaoDeStatusInvalida(string $de, string $para): self
    {
        return new self(sprintf('Transição de status inválida de "%s" para "%s".', $de, $para), 422);
    }
}
