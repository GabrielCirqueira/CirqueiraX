<?php

declare(strict_types=1);

namespace App\Interface;

use App\DataObject\PaginaPdfDTO;

interface ExtratorTextoPdfInterface
{
    public function extrairTextoDaPagina(string $caminhoPdf, int $numeroPagina): string;

    /**
     * @return array<int, string>
     */
    public function extrairTextoDeIntervalo(string $caminhoPdf, int $paginaInicio, int $paginaFim): array;

    /**
     * @return list<PaginaPdfDTO>
     */
    public function extrairLayoutDoDocumento(string $caminhoPdf): array;
}
