<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

use App\Entity\LivroAudio;
use App\Entity\Usuario;
use App\Message\GerarAudioBlocoMessage;
use App\Message\GerarAudioBlocoVozMessage;
use App\Repository\LivroAudioBlocoRepository;
use App\Repository\LivroAudioBlocoVozRepository;
use App\Repository\LivroAudioRepository;
use DateTimeImmutable;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class FilaGeracaoLivrosAudioService
{
    private const string LIMITE_BLOCO_TRAVADO = '-10 minutes';
    private const string JANELA_ESCUTA_RECENTE = '-30 minutes';
    private const int SEGUNDOS_POR_PARTE_PADRAO = 55;

    public function __construct(
        private LivroAudioBlocoRepository $livroAudioBlocoRepository,
        private LivroAudioBlocoVozRepository $livroAudioBlocoVozRepository,
        private LivroAudioRepository $livroAudioRepository,
        private ConsultarLivrosAudioService $consultarLivrosAudio,
        private MessageBusInterface $messageBus,
    ) {}

    public function reservarProximoBloco(): ?string
    {
        $this->livroAudioBlocoRepository->devolverTravadosParaFila(new DateTimeImmutable(self::LIMITE_BLOCO_TRAVADO));

        for ($tentativa = 0; $tentativa < 3; ++$tentativa) {
            $candidatos = $this->livroAudioBlocoRepository->listarCandidatosParaGerar(new DateTimeImmutable(self::JANELA_ESCUTA_RECENTE));
            if ([] === $candidatos) {
                return null;
            }

            foreach ($candidatos as $uuid) {
                if ($this->livroAudioBlocoRepository->reservarParaGerar($uuid)) {
                    return $uuid;
                }
            }
        }

        return null;
    }

    public function reabastecer(): void
    {
        if ($this->livroAudioRepository->contarMensagensNaFila() > 0) {
            return;
        }

        if ($this->livroAudioBlocoRepository->contarPendentesAtivos() > 0) {
            $this->messageBus->dispatch(new GerarAudioBlocoMessage('proximo'));
        }
    }

    public function pausar(string $uuid, Usuario $usuario): LivroAudio
    {
        $livro = $this->consultarLivrosAudio->obterDoUsuario($uuid, $usuario);
        $livro->pausarFila();
        $this->livroAudioRepository->salvar($livro, true);

        return $livro;
    }

    public function retomar(string $uuid, Usuario $usuario): LivroAudio
    {
        $livro = $this->consultarLivrosAudio->obterDoUsuario($uuid, $usuario);
        $livro->retomarFila();
        $this->livroAudioRepository->salvar($livro, true);
        $this->despacharPendentes($livro);

        return $livro;
    }

    public function priorizar(string $uuid, Usuario $usuario): LivroAudio
    {
        $livro = $this->consultarLivrosAudio->obterDoUsuario($uuid, $usuario);
        $estavaPausado = $livro->isFilaPausada();
        $livro->priorizarFila($this->livroAudioRepository->maiorPrioridadeFila($usuario) + 1);
        $this->livroAudioRepository->salvar($livro, true);

        if ($estavaPausado) {
            $this->despacharPendentes($livro);
        }

        return $livro;
    }

    /**
     * @return array{segundosPorParte: int, partesNaFila: int, segundosRestantes: int, livros: list<array<string, mixed>>}
     */
    public function resumo(Usuario $usuario): array
    {
        $statusPorLivro = $this->livroAudioBlocoRepository->contarStatusPorLivro();
        $segundosPorParte = (int) round($this->livroAudioBlocoRepository->mediaSegundosGeracaoRecente() ?? self::SEGUNDOS_POR_PARTE_PADRAO);
        $escutaRecente = new DateTimeImmutable(self::JANELA_ESCUTA_RECENTE);

        $livros = array_values(array_filter(
            $this->livroAudioRepository->listarDoUsuario($usuario),
            static fn(LivroAudio $livro): bool => ($statusPorLivro[$livro->uuidTexto()]['pendentes'] ?? 0) + ($statusPorLivro[$livro->uuidTexto()]['gerando'] ?? 0) > 0,
        ));

        usort($livros, static function (LivroAudio $a, LivroAudio $b) use ($escutaRecente): int {
            return [$a->isFilaPausada(), -$a->prioridadeFila(), $a->ultimaEscutaEm() >= $escutaRecente ? 0 : 1, $a->criadoEm()]
                <=> [$b->isFilaPausada(), -$b->prioridadeFila(), $b->ultimaEscutaEm() >= $escutaRecente ? 0 : 1, $b->criadoEm()];
        });

        $acumulado = 0;
        $itens = [];
        foreach ($livros as $posicao => $livro) {
            $status = $statusPorLivro[$livro->uuidTexto()];
            $restantes = $status['pendentes'] + $status['gerando'];
            $segundosLivro = $restantes * $segundosPorParte;
            if (!$livro->isFilaPausada()) {
                $acumulado += $segundosLivro;
            }

            $itens[] = [
                'uuid' => $livro->uuidTexto(),
                'titulo' => $livro->titulo(),
                'posicao' => $posicao + 1,
                'pausado' => $livro->isFilaPausada(),
                'priorizado' => $livro->prioridadeFila() > 0,
                'ouvindoAgora' => null !== $livro->ultimaEscutaEm() && $livro->ultimaEscutaEm() >= $escutaRecente,
                'paginaAtual' => $livro->paginaAtual(),
                'totalPartes' => $status['total'],
                'partesProntas' => $status['prontos'],
                'partesRestantes' => $restantes,
                'gerandoAgora' => $status['gerando'] > 0,
                'segundosParaTerminar' => $livro->isFilaPausada() ? null : $acumulado,
            ];
        }

        return [
            'segundosPorParte' => $segundosPorParte,
            'partesNaFila' => array_sum(array_map(static fn(array $item): int => $item['pausado'] ? 0 : $item['partesRestantes'], $itens)),
            'segundosRestantes' => $acumulado,
            'livros' => $itens,
        ];
    }

    private function despacharPendentes(LivroAudio $livro): void
    {
        foreach ($this->livroAudioBlocoRepository->listarUuidsPendentesDoLivro($livro) as $uuid) {
            $this->messageBus->dispatch(new GerarAudioBlocoMessage($uuid));
        }

        foreach ($this->livroAudioBlocoVozRepository->listarPorLivro($livro) as $blocoVoz) {
            if ($blocoVoz->isPendente()) {
                $this->messageBus->dispatch(new GerarAudioBlocoVozMessage($blocoVoz->uuidTexto()));
            }
        }
    }
}
