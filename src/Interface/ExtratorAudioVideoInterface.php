<?php

declare(strict_types=1);

namespace App\Interface;

interface ExtratorAudioVideoInterface
{
    public function extrairAudioDoVideo(string $caminhoVideo, string $caminhoAudio): void;
}
