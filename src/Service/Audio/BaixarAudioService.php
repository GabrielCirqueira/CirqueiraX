<?php

declare(strict_types=1);

namespace App\Service\Audio;

use App\Entity\Audio;
use App\Exception\Storage\ArmazenamentoLocalException;
use App\Exception\Video\YtDlpException;
use App\Interface\ArmazenamentoInterface;
use App\Interface\ExtratorAudioInterface;
use App\Repository\AudioRepository;
use Psr\Log\LoggerInterface;

final readonly class BaixarAudioService
{
    public function __construct(
        private AudioRepository $audioRepository,
        private ExtratorAudioInterface $extratorAudio,
        private ArmazenamentoInterface $armazenamento,
        private LoggerInterface $logger,
        private string $diretorioAudios,
    ) {}

    public function executar(string $uuid): void
    {
        $audio = $this->audioRepository->buscarPorUuid($uuid);
        if (null === $audio || !$audio->isAguardandoDownload()) {
            return;
        }

        $this->audioRepository->salvar($audio->iniciarDownload());

        try {
            $this->baixarArquivo($audio);
        } catch (YtDlpException|ArmazenamentoLocalException $erro) {
            $this->logger->warning('Falha ao baixar o áudio.', ['uuid' => $uuid, 'erro' => $erro->getMessage()]);
            $audio->registrarFalha($erro->getMessage());
        }

        $this->audioRepository->salvar($audio);
    }

    private function baixarArquivo(Audio $audio): void
    {
        $this->armazenamento->criarDiretorio($this->diretorioAudios);

        $audio->concluirDownload($this->extratorAudio->baixarAudio($audio->url(), $this->diretorioAudios, $audio->uuidTexto()));
    }
}
