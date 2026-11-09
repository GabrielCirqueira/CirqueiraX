<?php

declare(strict_types=1);

namespace App\Infra\Transcricao;

use App\Exception\Transcricao\TranscricaoException;
use App\Interface\ExtratorAudioVideoInterface;
use Symfony\Component\Process\Process;

final class ExtratorAudioFfmpegClient implements ExtratorAudioVideoInterface
{
    private const float TIMEOUT_EXTRACAO_SEGUNDOS = 3600.0;
    private const string TAXA_BITS_AUDIO = '96k';

    public function extrairAudioDoVideo(string $caminhoVideo, string $caminhoAudio): void
    {
        $processo = new Process([
            'ffmpeg', '-nostdin', '-loglevel', 'error', '-y', '-i', $caminhoVideo,
            '-vn', '-map', '0:a:0', '-c:a', 'aac', '-b:a', self::TAXA_BITS_AUDIO, '-movflags', '+faststart', $caminhoAudio,
        ]);
        $processo->setTimeout(self::TIMEOUT_EXTRACAO_SEGUNDOS);
        $processo->run();

        if ($processo->isSuccessful() && is_file($caminhoAudio) && filesize($caminhoAudio) > 0) {
            return;
        }

        if (is_file($caminhoAudio)) {
            unlink($caminhoAudio);
        }

        throw TranscricaoException::falhaAoExtrairAudioDoVideo($processo->getErrorOutput());
    }
}
