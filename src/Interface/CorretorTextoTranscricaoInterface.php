<?php

declare(strict_types=1);

namespace App\Interface;

interface CorretorTextoTranscricaoInterface
{
    public function corrigirBloco(string $bloco, ?string $idioma, int $parte, int $totalPartes): string;
}
