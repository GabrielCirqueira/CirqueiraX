<?php

declare(strict_types=1);

namespace App\Service\Transcricao;

use App\DataObject\Transcricao\ProgressoTranscricaoDTO;
use App\DataObject\Transcricao\ResultadoTranscricaoDTO;
use App\Entity\Transcricao;
use App\Exception\Transcricao\TranscricaoException;
use App\Interface\ArmazenamentoTranscricaoInterface;
use App\Interface\ExtratorAudioVideoInterface;
use App\Interface\TranscritorAudioInterface;
use App\Repository\TranscricaoRepository;
use Psr\Log\LoggerInterface;

final readonly class TranscreverAudioService
{
    private const float INTERVALO_GRAVACAO_PROGRESSO_SEGUNDOS = 1.5;
    private const string SUFIXO_AUDIO_EXTRAIDO = '-audio.m4a';

    public function __construct(
        private TranscricaoRepository $transcricaoRepository,
        private ArmazenamentoTranscricaoInterface $armazenamento,
        private TranscritorAudioInterface $transcritor,
        private ExtratorAudioVideoInterface $extratorAudio,
        private LoggerInterface $logger,
    ) {}

    public function executar(string $uuid): void
    {
        $transcricao = $this->transcricaoRepository->buscarPorUuid($uuid);
        if (null === $transcricao || !$transcricao->isEmAndamento()) {
            return;
        }

        if (!$transcricao->isAudioDisponivel() || !$this->armazenamento->existe((string) $transcricao->caminhoArquivo())) {
            $this->registrarFalha($transcricao, TranscricaoException::audioIndisponivel());

            return;
        }

        $transcricao->iniciarTranscricao();
        $this->transcricaoRepository->flush();

        try {
            $this->extrairAudioSeForVideo($transcricao);
            $resultado = $this->transcritor->transcrever(
                (string) $transcricao->caminhoArquivo(),
                $transcricao->idiomaSolicitado(),
                $this->criarRegistradorProgresso($transcricao),
            );
        } catch (TranscricaoException $erro) {
            $this->registrarFalha($transcricao, $erro);

            return;
        }

        $this->concluir($transcricao, $resultado);
    }

    private function extrairAudioSeForVideo(Transcricao $transcricao): void
    {
        if (!$transcricao->precisaExtrairAudioDoVideo()) {
            return;
        }

        $caminhoVideo = (string) $transcricao->caminhoArquivo();
        $caminhoAudio = sprintf('%s/%s%s', dirname($caminhoVideo), $transcricao->uuidTexto(), self::SUFIXO_AUDIO_EXTRAIDO);

        $this->extratorAudio->extrairAudioDoVideo($caminhoVideo, $caminhoAudio);
        $transcricao->substituirVideoPorAudio($caminhoAudio);
        $this->transcricaoRepository->flush();
        $this->armazenamento->remover($caminhoVideo);
    }

    /**
     * @return callable(ProgressoTranscricaoDTO): void
     */
    private function criarRegistradorProgresso(Transcricao $transcricao): callable
    {
        $ultimaGravacao = 0.0;

        return function (ProgressoTranscricaoDTO $progresso) use ($transcricao, &$ultimaGravacao): void {
            $agora = microtime(true);
            if ($agora - $ultimaGravacao < self::INTERVALO_GRAVACAO_PROGRESSO_SEGUNDOS) {
                return;
            }

            $ultimaGravacao = $agora;
            $transcricao->registrarProgresso($progresso->percentual, $progresso->segmentosParciais);
            $this->transcricaoRepository->flush();
        };
    }

    private function concluir(Transcricao $transcricao, ResultadoTranscricaoDTO $resultado): void
    {
        if ($resultado->isVazio()) {
            $this->registrarFalha($transcricao, TranscricaoException::nenhumaFalaEncontrada());

            return;
        }

        $transcricao->concluir($resultado->segmentos, $resultado->idiomaDetectado);
        $this->transcricaoRepository->flush();

        $this->logger->info('Transcrição de áudio concluída.', [
            'transcricao' => $transcricao->uuidTexto(),
            'segundosAudio' => $transcricao->duracaoSegundos(),
            'segundosProcessamento' => $transcricao->segundosProcessamento(),
            'palavras' => $transcricao->totalPalavras(),
        ]);
    }

    private function registrarFalha(Transcricao $transcricao, TranscricaoException $erro): void
    {
        $transcricao->registrarFalha($erro->getMessage());
        $this->transcricaoRepository->flush();

        $this->logger->warning('Falha ao transcrever áudio.', [
            'transcricao' => $transcricao->uuidTexto(),
            'erro' => $erro->getMessage(),
        ]);
    }
}
