<?php

declare(strict_types=1);

namespace App\Exception\Audio;

use DomainException;

final class SinteseVozException extends DomainException
{
    public static function textoVazio(): self
    {
        return new self('O texto fornecido para síntese de voz não pode estar vazio.', 400);
    }

    public static function arquivoDestinoInvalido(string $caminho): self
    {
        return new self(sprintf('O diretório de destino do áudio "%s" não é válido ou não possui permissão de escrita.', $caminho), 400);
    }

    public static function falhaAoExecutarSintese(string $motivo): self
    {
        return new self(sprintf('Falha ao executar síntese de voz pelo sintetizador: %s', $motivo), 500);
    }

    public function foiCancelada(): bool
    {
        return 409 === $this->getCode();
    }

    public static function cancelada(): self
    {
        return new self('A síntese de voz foi cancelada.', 409);
    }

    public static function falhaAoCalcularDuracao(string $motivo): self
    {
        return new self(sprintf('Não foi possível obter a duração do áudio gerado: %s', $motivo), 500);
    }
}
