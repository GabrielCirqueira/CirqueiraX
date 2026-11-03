<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

use App\Message\ProcessarLivroAudioMessage;
use App\Repository\LivroAudioBlocoRepository;
use App\Repository\LivroAudioRepository;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class CorrigirVozLivrosAudioService
{
    public function __construct(
        private DefinirIdiomaLivroAudioService $definirIdiomaLivro,
        private LivroAudioBlocoRepository $livroAudioBlocoRepository,
        private LivroAudioRepository $livroAudioRepository,
        private MessageBusInterface $messageBus,
    ) {}

    public function executar(): int
    {
        $livros = $this->livroAudioRepository->listarPorEnvio();
        $partesReiniciadas = 0;

        foreach ($livros as $livro) {
            $blocos = $this->livroAudioBlocoRepository->listarPorLivro($livro);
            if ([] === $blocos) {
                continue;
            }

            $voz = $this->definirIdiomaLivro->executar($livro)->voz();

            foreach ($blocos as $bloco) {
                if ($bloco->isPronto() && !$bloco->foiGeradoComVoz($voz)) {
                    $bloco->reiniciarGeracao();
                    ++$partesReiniciadas;
                }
            }
        }

        $this->livroAudioBlocoRepository->flush();
        $this->livroAudioRepository->limparFilaDeGeracao();

        foreach ($livros as $livro) {
            $this->messageBus->dispatch(new ProcessarLivroAudioMessage($livro->uuidTexto()));
        }

        return $partesReiniciadas;
    }
}
