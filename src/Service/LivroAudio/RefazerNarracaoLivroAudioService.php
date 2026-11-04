<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

use App\Entity\LivroAudio;
use App\Entity\LivroAudioBloco;
use App\Entity\LivroAudioBlocoVoz;
use App\Message\GerarAudioBlocoMessage;
use App\Message\GerarAudioBlocoVozMessage;
use App\Repository\LivroAudioBlocoRepository;
use App\Repository\LivroAudioBlocoVozRepository;
use App\Repository\LivroAudioRepository;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class RefazerNarracaoLivroAudioService
{
    public function __construct(
        private ExtrairTextoNarracaoLivroService $extrairTextoNarracao,
        private LivroAudioBlocoRepository $livroAudioBlocoRepository,
        private LivroAudioBlocoVozRepository $livroAudioBlocoVozRepository,
        private LivroAudioRepository $livroAudioRepository,
        private MessageBusInterface $messageBus,
    ) {}

    public function executar(LivroAudio $livro): void
    {
        $blocos = $this->livroAudioBlocoRepository->listarPorLivro($livro);
        if ([] === $blocos) {
            return;
        }

        $textos = $this->extrairTextoNarracao->executar($livro);
        foreach ($blocos as $bloco) {
            $bloco->redefinirTexto($this->extrairTextoNarracao->textoDoIntervalo($textos, $bloco->paginaInicio(), $bloco->paginaFim()));
        }

        $vozes = $this->livroAudioBlocoVozRepository->listarPorLivro($livro);
        foreach ($vozes as $blocoVoz) {
            $blocoVoz->reiniciarGeracao();
        }

        $livro->iniciarGeracaoAudio();
        $this->livroAudioRepository->salvar($livro, true);

        $blocoAtual = $livro->blocoAtual() ?? 1;

        foreach ($this->ordenarAPartirDe($blocos, $blocoAtual, static fn(LivroAudioBloco $bloco): int => $bloco->numeroBloco()) as $bloco) {
            $this->messageBus->dispatch(new GerarAudioBlocoMessage($bloco->uuidTexto()));
        }

        foreach ($this->ordenarAPartirDe($vozes, $blocoAtual, static fn(LivroAudioBlocoVoz $blocoVoz): int => $blocoVoz->bloco()->numeroBloco()) as $blocoVoz) {
            $this->messageBus->dispatch(new GerarAudioBlocoVozMessage($blocoVoz->uuidTexto()));
        }
    }

    /**
     * @template T
     *
     * @param list<T>          $itens
     * @param callable(T): int $numeroDe
     *
     * @return list<T>
     */
    private function ordenarAPartirDe(array $itens, int $numeroInicial, callable $numeroDe): array
    {
        usort($itens, static function (mixed $a, mixed $b) use ($numeroInicial, $numeroDe): int {
            $numeroA = $numeroDe($a);
            $numeroB = $numeroDe($b);

            return [$numeroA < $numeroInicial, $numeroA] <=> [$numeroB < $numeroInicial, $numeroB];
        });

        return $itens;
    }
}
