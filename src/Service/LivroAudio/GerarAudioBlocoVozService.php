<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

use App\DataObject\TrechoNarracaoDTO;
use App\Interface\ArmazenamentoLivroInterface;
use App\Interface\SintetizadorVozInterface;
use App\Repository\LivroAudioBlocoVozRepository;
use App\Repository\LivroAudioRepository;
use Psr\Log\LoggerInterface;
use Throwable;

final readonly class GerarAudioBlocoVozService
{
    public function __construct(
        private LivroAudioBlocoVozRepository $livroAudioBlocoVozRepository,
        private LivroAudioRepository $livroAudioRepository,
        private SintetizadorVozInterface $sintetizadorVoz,
        private PrepararTextoNarracaoService $prepararTextoNarracao,
        private AplicarPronunciasService $aplicarPronuncias,
        private ResolverVozLivroAudioService $resolverVoz,
        private ArmazenamentoLivroInterface $armazenamentoLivro,
        private LoggerInterface $logger,
    ) {}

    public function executar(string $blocoVozUuid): void
    {
        $blocoVoz = $this->livroAudioBlocoVozRepository->buscarPorUuid($blocoVozUuid);
        if (null === $blocoVoz) {
            $this->logger->warning('Voz adicional de bloco não encontrada para sintetizar áudio.', ['blocoVozUuid' => $blocoVozUuid]);

            return;
        }

        if ($blocoVoz->isPronto()) {
            return;
        }

        $bloco = $blocoVoz->bloco();
        $livro = $bloco->livro();
        if ($livro->isFilaPausada()) {
            return;
        }
        $livroUuid = $livro->uuidTexto();
        $diretorio = $this->resolverVoz->diretorioVoz($livro, $blocoVoz->voz());

        $blocoVoz->iniciarGeracao();
        $this->livroAudioBlocoVozRepository->salvar($blocoVoz, true);

        if (!is_dir($diretorio) && !mkdir($diretorio, 0o775, true) && !is_dir($diretorio)) {
            $blocoVoz->registrarFalha(sprintf('Falha ao criar diretório da voz "%s".', $diretorio));
            $this->livroAudioBlocoVozRepository->salvar($blocoVoz, true);

            return;
        }

        $caminhoMp3 = sprintf('%s/bloco_%d.mp3', $diretorio, $bloco->numeroBloco());
        $livroFoiApagado = fn(): bool => !$this->livroAudioRepository->existe($livroUuid);
        $vozFoiRemovida = fn(): bool => !$this->livroAudioBlocoVozRepository->existe($blocoVozUuid);
        $deveCancelar = static fn(): bool => $livroFoiApagado() || $vozFoiRemovida();

        try {
            $resultado = $this->sintetizadorVoz->sintetizar(
                $this->aplicarPronuncias->aplicar($this->prepararTextoNarracao->preparar($bloco->texto()), $livro->pronuncias()),
                $caminhoMp3,
                $blocoVoz->voz(),
                $deveCancelar,
            );
        } catch (Throwable $e) {
            if ($this->descartarSeCancelado($livroFoiApagado, $vozFoiRemovida, $livroUuid, $caminhoMp3)
                || $this->livroAudioBlocoVozRepository->foiReiniciado($blocoVozUuid)) {
                return;
            }

            $blocoVoz->registrarFalha($e->getMessage());
            $this->livroAudioBlocoVozRepository->salvar($blocoVoz, true);

            throw $e;
        }

        if ($this->descartarSeCancelado($livroFoiApagado, $vozFoiRemovida, $livroUuid, $caminhoMp3)
            || $this->livroAudioBlocoVozRepository->foiReiniciado($blocoVozUuid)) {
            return;
        }

        $blocoVoz->concluirGeracao(
            caminhoAudio: $resultado->caminhoAudio(),
            duracaoSegundos: $resultado->duracaoSegundos(),
            tamanhoBytes: $resultado->tamanhoBytes(),
            trechos: array_map(
                static fn(TrechoNarracaoDTO $trecho): array => $trecho->paraArray(),
                $resultado->trechos(),
            ),
        );
        $this->livroAudioBlocoVozRepository->salvar($blocoVoz, true);
    }

    private function descartarSeCancelado(callable $livroFoiApagado, callable $vozFoiRemovida, string $livroUuid, string $caminhoMp3): bool
    {
        if ($livroFoiApagado()) {
            $this->armazenamentoLivro->removerLivro($livroUuid);

            return true;
        }

        if ($vozFoiRemovida()) {
            if (is_file($caminhoMp3)) {
                unlink($caminhoMp3);
            }

            return true;
        }

        return false;
    }
}
