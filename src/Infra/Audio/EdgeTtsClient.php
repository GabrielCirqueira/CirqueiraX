<?php

declare(strict_types=1);

namespace App\Infra\Audio;

final class EdgeTtsClient extends SintetizadorVozPorProcesso
{
    public const string VOZ_PADRAO = 'pt-BR-AntonioNeural';
    private const float TIMEOUT_SINTESE_SEGUNDOS = 180.0;

    protected function vozPadrao(): string
    {
        return self::VOZ_PADRAO;
    }

    protected function timeoutSegundos(): float
    {
        return self::TIMEOUT_SINTESE_SEGUNDOS;
    }

    protected function montarComando(string $voz, string $caminhoTexto, string $caminhoAudio, string $caminhoPalavras): array
    {
        return [
            'python3',
            $this->projectDir . '/bin/sintetizar-voz.py',
            '--voz',
            $voz,
            '--arquivo-texto',
            $caminhoTexto,
            '--audio',
            $caminhoAudio,
            '--palavras',
            $caminhoPalavras,
        ];
    }
}
