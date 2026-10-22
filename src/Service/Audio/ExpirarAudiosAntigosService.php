<?php

declare(strict_types=1);

namespace App\Service\Audio;

use App\DataObject\ResultadoExpiracaoAudiosDTO;
use App\Entity\Audio;
use App\Exception\Audio\AudioException;
use App\Exception\Storage\ArmazenamentoLocalException;
use App\Interface\ArmazenamentoInterface;
use App\Repository\AudioRepository;
use DateTimeImmutable;
use Psr\Log\LoggerInterface;

final readonly class ExpirarAudiosAntigosService
{
    private const string LIMITE_DOWNLOAD_INTERROMPIDO = '-1 hour';

    public function __construct(
        private AudioRepository $audioRepository,
        private ArmazenamentoInterface $armazenamento,
        private LoggerInterface $logger,
    ) {}

    public function executar(): ResultadoExpiracaoAudiosDTO
    {
        $limiteRetencao = new DateTimeImmutable(sprintf('-%d days', Audio::DIAS_RETENCAO_ARQUIVO));
        $bytesLiberados = 0;
        $totalExpirados = 0;
        $falhas = [];

        foreach ($this->audioRepository->buscarDisponiveisBaixadosAntesDe($limiteRetencao) as $audio) {
            try {
                $bytesLiberados += $this->expirarAudio($audio);
                ++$totalExpirados;
            } catch (ArmazenamentoLocalException $erro) {
                $falhas[$audio->uuidTexto()] = $erro->getMessage();
            }
        }

        $totalInterrompidos = $this->encerrarDownloadsInterrompidos();
        $this->audioRepository->flush();

        $resultado = new ResultadoExpiracaoAudiosDTO($totalExpirados, $totalInterrompidos, $bytesLiberados, $falhas);
        $this->registrarResultado($resultado);

        return $resultado;
    }

    private function expirarAudio(Audio $audio): int
    {
        $this->armazenamento->remover((string) $audio->caminhoArquivo());
        $audio->expirar();

        return (int) $audio->tamanhoBytes();
    }

    private function encerrarDownloadsInterrompidos(): int
    {
        $limite = new DateTimeImmutable(self::LIMITE_DOWNLOAD_INTERROMPIDO);
        $interrompidos = $this->audioRepository->buscarEmProcessamentoAtualizadosAntesDe($limite);

        foreach ($interrompidos as $audio) {
            $audio->registrarFalha(AudioException::downloadInterrompido()->getMessage());
        }

        return count($interrompidos);
    }

    private function registrarResultado(ResultadoExpiracaoAudiosDTO $resultado): void
    {
        $this->logger->info('Expiração de áudios antigos finalizada.', [
            'expirados' => $resultado->totalExpirados(),
            'interrompidos' => $resultado->totalInterrompidos(),
            'bytesLiberados' => $resultado->bytesLiberados(),
            'falhas' => $resultado->falhas(),
        ]);
    }
}
