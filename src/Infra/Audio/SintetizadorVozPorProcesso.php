<?php

declare(strict_types=1);

namespace App\Infra\Audio;

use App\DataObject\PalavraNarracaoDTO;
use App\DataObject\ResultadoSinteseVozDTO;
use App\DataObject\TrechoNarracaoDTO;
use App\Exception\Audio\SinteseVozException;
use App\Interface\SintetizadorVozInterface;
use Symfony\Component\Process\Process;

abstract class SintetizadorVozPorProcesso implements SintetizadorVozInterface
{
    private const float TIMEOUT_SINTESE_SEGUNDOS = 600.0;
    private const float TIMEOUT_PROBE_SEGUNDOS = 15.0;
    private const int INTERVALO_CANCELAMENTO_MICROSSEGUNDOS = 500000;

    public function __construct(
        private readonly AgrupadorPalavrasNarracao $agrupadorPalavras,
        protected readonly string $projectDir,
    ) {}

    /**
     * @return list<string>
     */
    abstract protected function montarComando(string $voz, string $caminhoTexto, string $caminhoAudio, string $caminhoPalavras): array;

    abstract protected function vozPadrao(): string;

    protected function timeoutSegundos(): float
    {
        return self::TIMEOUT_SINTESE_SEGUNDOS;
    }

    public function sintetizar(string $texto, string $caminhoDestinoMp3, ?string $voz = null, ?callable $deveCancelar = null, bool $permitirMotorAlternativo = false): ResultadoSinteseVozDTO
    {
        $textoLimpo = trim($texto);
        if ('' === $textoLimpo) {
            throw SinteseVozException::textoVazio();
        }

        $diretorioDestino = dirname($caminhoDestinoMp3);
        if (!is_dir($diretorioDestino) && !mkdir($diretorioDestino, 0o775, true) && !is_dir($diretorioDestino)) {
            throw SinteseVozException::arquivoDestinoInvalido($caminhoDestinoMp3);
        }

        $vozEscolhida = $voz ?? $this->vozPadrao();
        $caminhoTexto = $caminhoDestinoMp3 . '.txt';
        $caminhoPalavras = $caminhoDestinoMp3 . '.palavras.json';

        if (false === file_put_contents($caminhoTexto, $textoLimpo)) {
            throw SinteseVozException::arquivoDestinoInvalido($caminhoTexto);
        }

        $processo = new Process($this->montarComando($vozEscolhida, $caminhoTexto, $caminhoDestinoMp3, $caminhoPalavras));
        $processo->setTimeout($this->timeoutSegundos());
        $processo->start();

        while ($processo->isRunning()) {
            if (null !== $deveCancelar && $deveCancelar()) {
                $processo->stop(0);
                $this->removerArquivos($caminhoTexto, $caminhoPalavras);

                throw SinteseVozException::cancelada();
            }

            usleep(self::INTERVALO_CANCELAMENTO_MICROSSEGUNDOS);
            $processo->checkTimeout();
        }

        $this->removerArquivos($caminhoTexto);

        if (!$processo->isSuccessful()) {
            $this->removerArquivos($caminhoPalavras);

            throw SinteseVozException::falhaAoExecutarSintese($processo->getErrorOutput());
        }

        $trechos = $this->lerTrechos($textoLimpo, $caminhoPalavras);

        if (!file_exists($caminhoDestinoMp3) || 0 === (int) filesize($caminhoDestinoMp3)) {
            throw SinteseVozException::falhaAoExecutarSintese('O arquivo de áudio não foi gerado ou está vazio.');
        }

        $duracaoSegundos = $this->obterDuracaoAudio($caminhoDestinoMp3);
        $tamanhoBytes = (int) filesize($caminhoDestinoMp3);

        return new ResultadoSinteseVozDTO(
            caminhoAudio: $caminhoDestinoMp3,
            duracaoSegundos: $duracaoSegundos,
            tamanhoBytes: $tamanhoBytes,
            trechos: $trechos,
            vozUsada: $vozEscolhida,
        );
    }

    /**
     * @return list<TrechoNarracaoDTO>
     */
    private function lerTrechos(string $texto, string $caminhoPalavras): array
    {
        if (!is_file($caminhoPalavras)) {
            return [];
        }

        $conteudo = (string) file_get_contents($caminhoPalavras);
        $this->removerArquivos($caminhoPalavras);

        $dados = json_decode($conteudo, true);
        if (!is_array($dados)) {
            return [];
        }

        $palavras = [];
        foreach ($dados as $dado) {
            if (!is_array($dado) || !isset($dado['inicio'], $dado['fim'], $dado['texto'])) {
                continue;
            }

            $palavras[] = new PalavraNarracaoDTO(
                inicio: (float) $dado['inicio'],
                fim: (float) $dado['fim'],
                texto: (string) $dado['texto'],
            );
        }

        return $this->agrupadorPalavras->agrupar($texto, $palavras);
    }

    private function removerArquivos(string ...$caminhos): void
    {
        foreach ($caminhos as $caminho) {
            if (is_file($caminho)) {
                unlink($caminho);
            }
        }
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
