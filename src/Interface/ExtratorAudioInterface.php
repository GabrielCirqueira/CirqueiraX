<?php

declare(strict_types=1);

namespace App\Interface;

use App\DataObject\AudioBaixadoDTO;

interface ExtratorAudioInterface
{
    public function baixarAudio(string $url, string $diretorioDestino, string $nomeArquivo): AudioBaixadoDTO;
}
