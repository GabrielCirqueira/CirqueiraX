<?php

declare(strict_types=1);

namespace App\Service\Transcricao;

use App\DataObject\Transcricao\ResultadoExpiracaoAudiosTranscricaoDTO;
use App\Entity\Transcricao;
use App\Exception\Transcricao\TranscricaoException;
use App\Interface\ArmazenamentoTranscricaoInterface;
use App\Repository\TranscricaoRepository;
use DateTimeImmutable;
use Psr\Log\LoggerInterface;

final readonly class ExpirarAudiosTranscricaoService
{
    private const string LIMITE_TRANSCRICAO_TRAVADA = '-6 hours';

    public function __construct(
        private TranscricaoRepository $transcricaoRepository,
        private ArmazenamentoTranscricaoInterface $armazenamento,
        private LoggerInterface $logger,
    ) {}

    public function executar(): ResultadoExpiracaoAudiosTranscricaoDTO
    {
        $limiteRetencao = new DateTimeImmutable(sprintf('-%d days', Transcricao::DIAS_RETENCAO_AUDIO));
        $bytesLiberados = 0;
        $totalExpirados = 0;
        $falhas = [];

        foreach ($this->transcricaoRepository->buscarComAudioCriadasAntesDe($limiteRetencao) as $transcricao) {
            try {
                $bytesLiberados += $this->armazenamento->remover((string) $transcricao->caminhoArquivo());
                $transcricao->expirarAudio();
                ++$totalExpirados;
            } catch (TranscricaoException $erro) {
                $falhas[$transcricao->uuidTexto()] = $erro->getMessage();
            }
        }

        $totalInterrompidas = $this->encerrarTranscricoesTravadas();
        $this->transcricaoRepository->flush();

        $resultado = new ResultadoExpiracaoAudiosTranscricaoDTO($totalExpirados, $totalInterrompidas, $bytesLiberados, $falhas);
        $this->registrarResultado($resultado);

        return $resultado;
    }

    private function encerrarTranscricoesTravadas(): int
    {
        $limite = new DateTimeImmutable(self::LIMITE_TRANSCRICAO_TRAVADA);
        $travadas = $this->transcricaoRepository->buscarTranscrevendoAtualizadasAntesDe($limite);

        foreach ($travadas as $transcricao) {
            $transcricao->registrarFalha(TranscricaoException::transcricaoInterrompida()->getMessage());
        }

        return count($travadas);
    }

    private function registrarResultado(ResultadoExpiracaoAudiosTranscricaoDTO $resultado): void
    {
        $this->logger->info('Expiração de áudios de transcrição finalizada.', [
            'expirados' => $resultado->totalExpirados,
            'interrompidas' => $resultado->totalInterrompidas,
            'bytesLiberados' => $resultado->bytesLiberados,
            'falhas' => $resultado->falhas,
        ]);
    }
}
