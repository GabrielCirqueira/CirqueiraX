<?php

declare(strict_types=1);

namespace App\Interface;

interface ExtratorTextoPdfInterface
{
    public function extrairTextoDaPagina(string $caminhoPdf, int $numeroPagina): string;

    /**
     * @return array<int, string>
     */
    public function extrairTextoDeIntervalo(string $caminhoPdf, int $paginaInicio, int $paginaFim): array;
}
