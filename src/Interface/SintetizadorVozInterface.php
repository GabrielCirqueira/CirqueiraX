<?php

declare(strict_types=1);

namespace App\Interface;

use App\DataObject\ResultadoSinteseVozDTO;

interface SintetizadorVozInterface
{
    /**
     * @param (callable(): bool)|null $deveCancelar
     */
    public function sintetizar(string $texto, string $caminhoDestinoMp3, ?string $voz = null, ?callable $deveCancelar = null): ResultadoSinteseVozDTO;
}
