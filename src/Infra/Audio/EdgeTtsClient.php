<?php

declare(strict_types=1);

namespace App\Infra\Audio;

use App\DataObject\ResultadoSinteseVozDTO;
use App\Exception\Audio\SinteseVozException;
use App\Interface\SintetizadorVozInterface;
use Symfony\Component\Process\Process;

final class EdgeTtsClient implements SintetizadorVozInterface
{
    public const string VOZ_PADRAO = 'pt-BR-AntonioNeural';
    private const float TIMEOUT_SINTESE_SEGUNDOS = 180.0;
    private const float TIMEOUT_PROBE_SEGUNDOS = 15.0;

    public function sintetizar(string $texto, string $caminhoDestinoMp3, ?string $voz = null): ResultadoSinteseVozDTO
    {
        $textoLimpo = trim($texto);
        if ('' === $textoLimpo) {
            throw SinteseVozException::textoVazio();
        }

        $diretorioDestino = dirname($caminhoDestinoMp3);
        if (!is_dir($diretorioDestino) && !mkdir($diretorioDestino, 0o775, true) && !is_dir($diretorioDestino)) {
            throw SinteseVozException::arquivoDestinoInvalido($caminhoDestinoMp3);
        }

        $vozEscolhida = $voz ?? self::VOZ_PADRAO;

        $comando = [
            'edge-tts',
            '--voice',
            $vozEscolhida,
            '--text',
            $textoLimpo,
            '--write-media',
            $caminhoDestinoMp3,
        ];

        $processo = new Process($comando);
        $processo->setTimeout(self::TIMEOUT_SINTESE_SEGUNDOS);
        $processo->run();

        if (!$processo->isSuccessful()) {
            throw SinteseVozException::falhaAoExecutarSintese($processo->getErrorOutput());
        }

        if (!file_exists($caminhoDestinoMp3) || 0 === (int) filesize($caminhoDestinoMp3)) {
            throw SinteseVozException::falhaAoExecutarSintese('O arquivo de áudio não foi gerado ou está vazio.');
        }

        $duracaoSegundos = $this->obterDuracaoAudio($caminhoDestinoMp3);
        $tamanhoBytes = (int) filesize($caminhoDestinoMp3);

        return new ResultadoSinteseVozDTO(
            caminhoAudio: $caminhoDestinoMp3,
            duracaoSegundos: $duracaoSegundos,
            tamanhoBytes: $tamanhoBytes,
        );
    }

    private function obterDuracaoAudio(string $caminhoAudio): int
    {
        $comandoProbe = [
            'ffprobe',
            '-v',
            'error',
            '-show_entries',
            'format=duration',
            '-of',
            'default=noprint_wrappers=1:nokey=1',
            $caminhoAudio,
        ];

        $processo = new Process($comandoProbe);
        $processo->setTimeout(self::TIMEOUT_PROBE_SEGUNDOS);
        $processo->run();

        if (!$processo->isSuccessful()) {
            throw SinteseVozException::falhaAoCalcularDuracao($processo->getErrorOutput());
        }

        $saida = trim($processo->getOutput());
        if (!is_numeric($saida)) {
            throw SinteseVozException::falhaAoCalcularDuracao(sprintf('Saída inesperada do probe: "%s"', $saida));
        }

        return (int) round((float) $saida);
    }
}
