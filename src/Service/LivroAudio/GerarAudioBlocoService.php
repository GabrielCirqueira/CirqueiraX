<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

use App\Entity\LivroAudio;
use App\Interface\ArmazenamentoLivroInterface;
use App\Interface\SintetizadorVozInterface;
use App\Repository\LivroAudioBlocoRepository;
use App\Repository\LivroAudioRepository;
use Psr\Log\LoggerInterface;
use Throwable;

final readonly class GerarAudioBlocoService
{
    public function __construct(
        private LivroAudioBlocoRepository $livroAudioBlocoRepository,
        private LivroAudioRepository $livroAudioRepository,
        private SintetizadorVozInterface $sintetizadorVoz,
        private DefinirIdiomaLivroAudioService $definirIdiomaLivro,
        private ArmazenamentoLivroInterface $armazenamentoLivro,
        private LoggerInterface $logger,
    ) {}

    public function executar(string $blocoUuid): void
    {
        $bloco = $this->livroAudioBlocoRepository->buscarPorUuid($blocoUuid);
        if (null === $bloco) {
            $this->logger->warning('Bloco de livro em áudio não encontrado para sintetizar áudio.', ['blocoUuid' => $blocoUuid]);

            return;
        }

        if ($bloco->isPronto()) {
            return;
        }

        $livro = $bloco->livro();
        $bloco->iniciarGeracao();
        $this->livroAudioBlocoRepository->salvar($bloco, true);

        if (!$livro->isGerandoAudio() && !$livro->isParcial()) {
            $livro->iniciarGeracaoAudio();
            $this->livroAudioRepository->salvar($livro, true);
        }

        $caminhoPdf = $livro->caminhoPdf();
        $diretorioLivro = null !== $caminhoPdf ? dirname($caminhoPdf) : sprintf('/var/www/html/var/livros/%s', $livro->uuidTexto());
        $diretorioBlocos = sprintf('%s/blocos', $diretorioLivro);

        if (!is_dir($diretorioBlocos) && !mkdir($diretorioBlocos, 0o775, true) && !is_dir($diretorioBlocos)) {
            $motivoErro = sprintf('Falha ao criar diretório de blocos "%s".', $diretorioBlocos);
            $bloco->registrarFalha($motivoErro);
            $this->livroAudioBlocoRepository->salvar($bloco, true);
            $this->atualizarStatusGeralLivro($livro);

            return;
        }

        $caminhoMp3 = sprintf('%s/bloco_%d.mp3', $diretorioBlocos, $bloco->numeroBloco());

        $livroUuid = $livro->uuidTexto();
        $voz = $this->definirIdiomaLivro->executar($livro)->voz();
        $livroFoiApagado = fn(): bool => !$this->livroAudioRepository->existe($livroUuid);

        try {
            $resultado = $this->sintetizadorVoz->sintetizar($bloco->texto(), $caminhoMp3, $voz, $livroFoiApagado);

            if ($livroFoiApagado()) {
                $this->armazenamentoLivro->removerLivro($livroUuid);

                return;
            }

            $bloco->concluirGeracao(
                caminhoAudio: $resultado->caminhoAudio(),
                duracaoSegundos: $resultado->duracaoSegundos(),
                tamanhoBytes: $resultado->tamanhoBytes(),
                voz: $voz,
            );
            $this->livroAudioBlocoRepository->salvar($bloco, true);
        } catch (Throwable $e) {
            if ($livroFoiApagado()) {
                $this->armazenamentoLivro->removerLivro($livroUuid);

                return;
            }

            $bloco->registrarFalha($e->getMessage());
            $this->livroAudioBlocoRepository->salvar($bloco, true);
            $this->atualizarStatusGeralLivro($livro);

            throw $e;
        }

        $this->atualizarStatusGeralLivro($livro);
    }

    private function atualizarStatusGeralLivro(LivroAudio $livro): void
    {
        $blocos = $this->livroAudioBlocoRepository->listarPorLivro($livro);
        if (empty($blocos)) {
            return;
        }

        $total = count($blocos);
        $prontos = 0;
        $erros = 0;
        $emAndamento = 0;

        foreach ($blocos as $bloco) {
            if ($bloco->isPronto()) {
                ++$prontos;
            } elseif ($bloco->isErro()) {
                ++$erros;
            } else {
                ++$emAndamento;
            }
        }

        if ($prontos === $total) {
            $livro->concluirGeracao();
        } elseif (0 === $emAndamento && $erros > 0) {
            if ($prontos > 0) {
                $livro->marcarComoParcial();
            } else {
                $livro->registrarFalha(sprintf('%d bloco(s) falharam na síntese de áudio.', $erros));
            }
        }

        $this->livroAudioRepository->salvar($livro, true);
    }
}
