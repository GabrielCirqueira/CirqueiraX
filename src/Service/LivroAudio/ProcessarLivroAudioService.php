<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

use App\Message\GerarAudioBlocoMessage;
use App\Repository\LivroAudioBlocoRepository;
use App\Repository\LivroAudioRepository;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\MessageBusInterface;
use Throwable;

final readonly class ProcessarLivroAudioService
{
    public function __construct(
        private DividirLivroEmBlocosService $dividirLivroEmBlocosService,
        private LivroAudioBlocoRepository $livroAudioBlocoRepository,
        private LivroAudioRepository $livroAudioRepository,
        private MessageBusInterface $messageBus,
        private LoggerInterface $logger,
    ) {}

    public function executar(string $livroUuid): void
    {
        $livro = $this->livroAudioRepository->buscarPorUuid($livroUuid);
        if (null === $livro) {
            $this->logger->warning('Livro não encontrado para processamento de áudio.', ['livroUuid' => $livroUuid]);

            return;
        }

        $blocosExistentes = $this->livroAudioBlocoRepository->listarPorLivro($livro);

        if (empty($blocosExistentes)) {
            try {
                $blocos = $this->dividirLivroEmBlocosService->executar($livro);
            } catch (Throwable $e) {
                $livro->registrarFalha(sprintf('Falha ao processar e dividir o livro em blocos: %s', $e->getMessage()));
                $this->livroAudioRepository->salvar($livro, true);

                throw $e;
            }
        } else {
            $blocos = $this->livroAudioBlocoRepository->listarNaoProntosDoLivro($livro);
            foreach ($blocos as $bloco) {
                if ($bloco->isErro()) {
                    $bloco->reiniciarGeracao();
                    $this->livroAudioBlocoRepository->salvar($bloco, false);
                }
            }
            $this->livroAudioBlocoRepository->flush();
        }

        if (empty($blocos)) {
            if ($livro->totalPaginas() <= 0) {
                $livro->marcarComoParcial();
                $this->livroAudioRepository->salvar($livro, true);
            }

            return;
        }

        $livro->iniciarGeracaoAudio();
        $this->livroAudioRepository->salvar($livro, true);

        foreach ($blocos as $bloco) {
            $this->messageBus->dispatch(new GerarAudioBlocoMessage($bloco->uuidTexto()));
        }
    }
}
