<?php

declare(strict_types=1);

namespace App\Infra\Audio;

use App\Enum\VozNarracao;

final class PiperTtsClient extends SintetizadorVozPorProcesso
{
    private const float TIMEOUT_SINTESE_SEGUNDOS = 900.0;

    public function __construct(
        AgrupadorPalavrasNarracao $agrupadorPalavras,
        string $projectDir,
        private readonly string $diretorioModelos,
    ) {
        parent::__construct($agrupadorPalavras, $projectDir);
    }

    public function disponivel(string $voz): bool
    {
        return is_file($this->caminhoModelo($voz));
    }

    protected function vozPadrao(): string
    {
        return VozNarracao::FABER->value;
    }

    protected function timeoutSegundos(): float
    {
        return self::TIMEOUT_SINTESE_SEGUNDOS;
    }

    protected function montarComando(string $voz, string $caminhoTexto, string $caminhoAudio, string $caminhoPalavras): array
    {
        return [
            'python3',
            $this->projectDir . '/bin/sintetizar-voz-piper.py',
            '--modelo',
            $this->caminhoModelo($voz),
            '--arquivo-texto',
            $caminhoTexto,
            '--audio',
            $caminhoAudio,
            '--palavras',
            $caminhoPalavras,
        ];
    }

    private function caminhoModelo(string $voz): string
    {
        $modelo = str_starts_with($voz, VozNarracao::PREFIXO_PIPER) ? substr($voz, strlen(VozNarracao::PREFIXO_PIPER)) : $voz;

        return sprintf('%s/%s.onnx', rtrim($this->diretorioModelos, '/'), basename($modelo));
    }
}
