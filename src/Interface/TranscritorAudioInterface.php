<?php

declare(strict_types=1);

namespace App\Interface;

use App\DataObject\Transcricao\ProgressoTranscricaoDTO;
use App\DataObject\Transcricao\ResultadoTranscricaoDTO;
use App\Enum\IdiomaTranscricao;

interface TranscritorAudioInterface
{
    public function medirDuracaoSegundos(string $caminhoAudio): ?float;

    /**
     * @param callable(ProgressoTranscricaoDTO): void $aoProgredir
     */
    public function transcrever(string $caminhoAudio, IdiomaTranscricao $idioma, callable $aoProgredir): ResultadoTranscricaoDTO;
}
