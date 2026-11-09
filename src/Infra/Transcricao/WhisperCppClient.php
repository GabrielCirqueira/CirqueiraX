<?php

declare(strict_types=1);

namespace App\Infra\Transcricao;

use App\DataObject\Transcricao\ProgressoTranscricaoDTO;
use App\DataObject\Transcricao\ResultadoTranscricaoDTO;
use App\DataObject\Transcricao\SegmentoTranscricaoDTO;
use App\Entity\Transcricao;
use App\Enum\IdiomaTranscricao;
use App\Exception\Transcricao\TranscricaoException;
use App\Interface\TranscritorAudioInterface;
use JsonException;
use Symfony\Component\Process\Process;
use Symfony\Component\Uid\Uuid;

final class WhisperCppClient implements TranscritorAudioInterface
{
    private const float TIMEOUT_CONVERSAO_SEGUNDOS = 1800.0;
    private const float TIMEOUT_MEDICAO_SEGUNDOS = 60.0;
    private const float TIMEOUT_TRANSCRICAO_SEGUNDOS = 43200.0;
    private const int TAXA_AMOSTRAGEM = 16000;
    private const int PERCENTUAL_MAXIMO_PARCIAL = 99;
    private const int PERCENTUAL_MAXIMO_ESTIMADO = 95;
    private const int ESPERA_SEM_SAIDA_MICROSSEGUNDOS = 250000;
    private const float INTERVALO_AVISO_SEGUNDOS = 1.0;
    private const int MILISSEGUNDOS_POR_SEGUNDO = 1000;
    private const string PADRAO_SEGMENTO = '/^\[(\d+):(\d{2}):(\d{2})\.(\d{3}) --> (\d+):(\d{2}):(\d{2})\.(\d{3})\]\s*(.*)$/';
    private const string PADRAO_PROGRESSO = '/progress\s*=\s*(\d+)%/';
    private const string PADRAO_RUIDO = '/^[\[(][^\])]*[\])]$/u';
    private const string SUFIXO_SAIDA_JSON = '.json';

    public function __construct(
        private readonly string $executavelWhisper,
        private readonly string $caminhoModelo,
        private readonly string $diretorioTemporario,
        private readonly int $threads,
    ) {}

    public function medirDuracaoSegundos(string $caminhoAudio): ?float
    {
        $processo = new Process([
            'ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', $caminhoAudio,
        ]);
        $processo->setTimeout(self::TIMEOUT_MEDICAO_SEGUNDOS);
        $processo->run();

        $saida = trim($processo->getOutput());
        if (!$processo->isSuccessful() || !is_numeric($saida)) {
            return null;
        }

        return (float) $saida;
    }

    public function transcrever(string $caminhoAudio, IdiomaTranscricao $idioma, callable $aoProgredir): ResultadoTranscricaoDTO
    {
        if (!is_file($this->caminhoModelo)) {
            throw TranscricaoException::modeloIndisponivel();
        }

        $baseTemporaria = sprintf('%s/transcricao-%s', rtrim($this->diretorioTemporario, '/'), Uuid::v4()->toRfc4122());
        $caminhoWav = $baseTemporaria . '.wav';

        try {
            $this->converterParaWav($caminhoAudio, $caminhoWav);
            $duracaoSegundos = $this->medirDuracaoSegundos($caminhoWav);
            $segmentosStreaming = $this->executarWhisper($caminhoWav, $baseTemporaria, $idioma, $duracaoSegundos, $aoProgredir);

            return $this->lerResultadoFinal($baseTemporaria . self::SUFIXO_SAIDA_JSON, $segmentosStreaming, $idioma);
        } finally {
            $this->removerTemporarios($caminhoWav, $baseTemporaria . self::SUFIXO_SAIDA_JSON);
        }
    }

    private function converterParaWav(string $caminhoAudio, string $caminhoWav): void
    {
        $processo = new Process([
            'ffmpeg', '-nostdin', '-loglevel', 'error', '-y', '-i', $caminhoAudio,
            '-vn', '-ar', (string) self::TAXA_AMOSTRAGEM, '-ac', '1', '-c:a', 'pcm_s16le', $caminhoWav,
        ]);
        $processo->setTimeout(self::TIMEOUT_CONVERSAO_SEGUNDOS);
        $processo->run();

        if (!$processo->isSuccessful() || !is_file($caminhoWav)) {
            throw TranscricaoException::falhaAoConverterAudio($processo->getErrorOutput());
        }
    }

    /**
     * @param callable(ProgressoTranscricaoDTO): void $aoProgredir
     *
     * @return list<SegmentoTranscricaoDTO>
     */
    private function executarWhisper(
        string $caminhoWav,
        string $baseSaida,
        IdiomaTranscricao $idioma,
        ?float $duracaoSegundos,
        callable $aoProgredir,
    ): array {
        $processo = new Process($this->montarComando($caminhoWav, $baseSaida, $idioma));
        $processo->setTimeout(self::TIMEOUT_TRANSCRICAO_SEGUNDOS);
        $processo->start();

        $leitor = new LeitorSaidaWhisper(self::PADRAO_SEGMENTO, self::PADRAO_PROGRESSO);
        $inicio = microtime(true);
        $ultimoAviso = 0.0;

        foreach ($processo->getIterator(Process::ITER_NON_BLOCKING) as $tipo => $conteudo) {
            $houveNovidade = $this->lerConteudo($leitor, $tipo, $conteudo);
            $agora = microtime(true);

            if ('' === $conteudo) {
                usleep(self::ESPERA_SEM_SAIDA_MICROSSEGUNDOS);
            }

            if (!$houveNovidade && $agora - $ultimoAviso < self::INTERVALO_AVISO_SEGUNDOS) {
                continue;
            }

            $ultimoAviso = $agora;
            $aoProgredir(new ProgressoTranscricaoDTO(
                $this->calcularPercentual($leitor, $duracaoSegundos, $agora - $inicio),
                $this->filtrarSegmentos($leitor->segmentos()),
            ));
        }

        if (!$processo->isSuccessful()) {
            throw TranscricaoException::falhaAoTranscrever($processo->getErrorOutput());
        }

        return $this->filtrarSegmentos($leitor->segmentos());
    }

    /**
     * @return list<string>
     */
    private function montarComando(string $caminhoWav, string $baseSaida, IdiomaTranscricao $idioma): array
    {
        return [
            $this->executavelWhisper,
            '-m', $this->caminhoModelo,
            '-f', $caminhoWav,
            '-l', $idioma->value,
            '-t', (string) $this->threads,
            '-bs', '1',
            '-bo', '1',
            '-pp',
            '-oj',
            '-of', $baseSaida,
        ];
    }

    private function lerConteudo(LeitorSaidaWhisper $leitor, string $tipo, string $conteudo): bool
    {
        if ('' === $conteudo) {
            return false;
        }

        return Process::OUT === $tipo ? $leitor->lerSaidaPadrao($conteudo) : $leitor->lerSaidaErro($conteudo);
    }

    private function calcularPercentual(LeitorSaidaWhisper $leitor, ?float $duracaoSegundos, float $segundosDecorridos): int
    {
        if (null === $duracaoSegundos || $duracaoSegundos <= 0) {
            return min(self::PERCENTUAL_MAXIMO_PARCIAL, $leitor->percentualInformado());
        }

        $ultimoFim = $leitor->ultimoFimSegundos() ?? 0.0;
        $percentualPorTrechos = (int) floor(($ultimoFim / $duracaoSegundos) * 100);
        $tempoEsperado = $duracaoSegundos * Transcricao::FATOR_TEMPO_PROCESSAMENTO;
        $percentualPorTempo = min(self::PERCENTUAL_MAXIMO_ESTIMADO, (int) floor(($segundosDecorridos / $tempoEsperado) * 100));

        return min(
            self::PERCENTUAL_MAXIMO_PARCIAL,
            max($percentualPorTrechos, $percentualPorTempo, $leitor->percentualInformado()),
        );
    }

    /**
     * @param list<SegmentoTranscricaoDTO> $segmentosStreaming
     */
    private function lerResultadoFinal(string $caminhoJson, array $segmentosStreaming, IdiomaTranscricao $idioma): ResultadoTranscricaoDTO
    {
        $idiomaPadrao = $idioma->isAutomatico() ? null : $idioma->value;
        $conteudo = is_file($caminhoJson) ? file_get_contents($caminhoJson) : false;

        if (false === $conteudo) {
            return new ResultadoTranscricaoDTO($segmentosStreaming, $idiomaPadrao);
        }

        try {
            $dados = json_decode($this->corrigirUtf8($conteudo), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return new ResultadoTranscricaoDTO($segmentosStreaming, $idiomaPadrao);
        }

        if (!is_array($dados)) {
            return new ResultadoTranscricaoDTO($segmentosStreaming, $idiomaPadrao);
        }

        $segmentosJson = $this->extrairSegmentosJson($dados);
        $idiomaDetectado = $dados['result']['language'] ?? $idiomaPadrao;

        return new ResultadoTranscricaoDTO(
            [] === $segmentosJson ? $segmentosStreaming : $segmentosJson,
            is_string($idiomaDetectado) ? $idiomaDetectado : $idiomaPadrao,
        );
    }

    /**
     * @param array<mixed> $dados
     *
     * @return list<SegmentoTranscricaoDTO>
     */
    private function extrairSegmentosJson(array $dados): array
    {
        $itens = $dados['transcription'] ?? [];
        if (!is_array($itens)) {
            return [];
        }

        $segmentos = [];
        foreach ($itens as $item) {
            $segmento = $this->criarSegmentoJson($item);
            if (null !== $segmento) {
                $segmentos[] = $segmento;
            }
        }

        return $this->filtrarSegmentos($segmentos);
    }

    private function criarSegmentoJson(mixed $item): ?SegmentoTranscricaoDTO
    {
        if (!is_array($item) || !is_string($item['text'] ?? null) || !is_array($item['offsets'] ?? null)) {
            return null;
        }

        return new SegmentoTranscricaoDTO(
            ((int) ($item['offsets']['from'] ?? 0)) / self::MILISSEGUNDOS_POR_SEGUNDO,
            ((int) ($item['offsets']['to'] ?? 0)) / self::MILISSEGUNDOS_POR_SEGUNDO,
            trim($item['text']),
        );
    }

    /**
     * @param list<SegmentoTranscricaoDTO> $segmentos
     *
     * @return list<SegmentoTranscricaoDTO>
     */
    private function filtrarSegmentos(array $segmentos): array
    {
        return array_values(array_filter(
            $segmentos,
            static fn (SegmentoTranscricaoDTO $segmento): bool => '' !== $segmento->texto
                && 1 !== preg_match(self::PADRAO_RUIDO, $segmento->texto),
        ));
    }

    private function corrigirUtf8(string $conteudo): string
    {
        return mb_check_encoding($conteudo, 'UTF-8') ? $conteudo : mb_convert_encoding($conteudo, 'UTF-8', 'UTF-8');
    }

    private function removerTemporarios(string ...$caminhos): void
    {
        foreach ($caminhos as $caminho) {
            if (is_file($caminho)) {
                unlink($caminho);
            }
        }
    }
}
