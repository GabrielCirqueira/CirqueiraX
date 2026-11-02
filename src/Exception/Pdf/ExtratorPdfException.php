<?php

declare(strict_types=1);

namespace App\Exception\Pdf;

use DomainException;

final class ExtratorPdfException extends DomainException
{
    public static function arquivoNaoEncontrado(string $caminho): self
    {
        return new self(sprintf('O arquivo PDF não foi encontrado no caminho "%s".', $caminho), 404);
    }

    public static function paginaInvalida(int $numeroPagina): self
    {
        return new self(sprintf('O número da página informado (%d) deve ser maior que zero.', $numeroPagina), 400);
    }

    public static function intervaloInvalido(int $inicio, int $fim): self
    {
        return new self(sprintf('Intervalo de páginas inválido: página inicial (%d) é maior que página final (%d).', $inicio, $fim), 400);
    }

    public static function falhaAoExecutarExtracao(string $motivo): self
    {
        return new self(sprintf('Ocorreu uma falha ao extrair texto do documento PDF: %s', $motivo), 500);
    }
}
