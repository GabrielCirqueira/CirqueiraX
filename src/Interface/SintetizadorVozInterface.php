<?php

declare(strict_types=1);

namespace App\Interface;

use App\DataObject\ResultadoSinteseVozDTO;

interface SintetizadorVozInterface
{
    public function sintetizar(string $texto, string $caminhoDestinoMp3, ?string $voz = null): ResultadoSinteseVozDTO;
}
