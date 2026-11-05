<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

use App\DataObject\ArquivoMidiaDTO;
use App\Entity\LivroAudio;
use App\Entity\LivroAudioBlocoVoz;
use App\Entity\Usuario;
use App\Enum\IdiomaLivroAudio;
use App\Enum\StatusLivroAudioBloco;
use App\Enum\VozNarracao;
use App\Exception\LivroAudio\LivroAudioException;
use App\Interface\SintetizadorVozInterface;
use App\Message\GerarAudioBlocoVozMessage;
use App\Repository\LivroAudioBlocoRepository;
use App\Repository\LivroAudioBlocoVozRepository;
use Symfony\Component\Messenger\MessageBusInterface;
use Throwable;

final readonly class GerenciarVozesLivroAudioService
{
    private const string TEXTO_AMOSTRA = 'Olá! Esta é a minha voz. Posso ler o seu livro do começo ao fim, no ritmo que você preferir.';
    private const string MIME_TYPE_AUDIO = 'audio/mpeg';

    public function __construct(
        private ConsultarLivrosAudioService $consultarLivrosAudio,
        private LivroAudioBlocoRepository $livroAudioBlocoRepository,
        private LivroAudioBlocoVozRepository $livroAudioBlocoVozRepository,
        private ResolverVozLivroAudioService $resolverVoz,
        private SintetizadorVozInterface $sintetizadorVoz,
        private MessageBusInterface $messageBus,
        private PainelSistemaLivrosAudioService $painelSistema,
        private string $diretorioBaseLivros,
    ) {}

    /**
     * @return list<array{id: string, nome: string, descricao: string, principal: bool, motor: string, status: string, totalBlocos: int, blocosProntos: list<int>, blocosComErro: int, tamanhoBytes: int, tamanhoEstimadoBytes: int}>
     */
    public function listar(string $uuid, Usuario $usuario): array
    {
        $livro = $this->consultarLivrosAudio->obterDoUsuario($uuid, $usuario);

        return $this->montarLista($livro);
    }

    /**
     * @return list<array{id: string, nome: string, descricao: string, principal: bool, motor: string, status: string, totalBlocos: int, blocosProntos: list<int>, blocosComErro: int, tamanhoBytes: int, tamanhoEstimadoBytes: int}>
     */
    public function solicitar(string $uuid, string $voz, Usuario $usuario): array
    {
        $livro = $this->consultarLivrosAudio->obterDoUsuario($uuid, $usuario);
        $this->validarVozAdicional($livro, $voz);
        $this->validarEspacoParaVoz($livro);

        $paraGerar = [];
        foreach ($this->livroAudioBlocoRepository->listarPorLivro($livro) as $bloco) {
            $blocoVoz = $this->livroAudioBlocoVozRepository->buscarPorBlocoEVoz($bloco, $voz);

            if (null === $blocoVoz) {
                $blocoVoz = new LivroAudioBlocoVoz($bloco, $voz);
            } elseif ($blocoVoz->isErro()) {
                $blocoVoz->reiniciarGeracao();
            } else {
                continue;
            }

            $this->livroAudioBlocoVozRepository->salvar($blocoVoz, false);
            $paraGerar[] = $blocoVoz;
        }

        $this->livroAudioBlocoVozRepository->flush();

        foreach ($paraGerar as $blocoVoz) {
            $this->messageBus->dispatch(new GerarAudioBlocoVozMessage($blocoVoz->uuidTexto()));
        }

        return $this->montarLista($livro);
    }

    /**
     * @return list<array{id: string, nome: string, descricao: string, principal: bool, motor: string, status: string, totalBlocos: int, blocosProntos: list<int>, blocosComErro: int, tamanhoBytes: int, tamanhoEstimadoBytes: int}>
     */
    public function remover(string $uuid, string $voz, Usuario $usuario): array
    {
        $livro = $this->consultarLivrosAudio->obterDoUsuario($uuid, $usuario);
        if ($voz === $this->resolverVoz->vozPrincipal($livro)) {
            throw LivroAudioException::vozPrincipalNaoRemovivel();
        }

        foreach ($this->livroAudioBlocoVozRepository->listarPorLivro($livro, $voz) as $blocoVoz) {
            $caminho = $blocoVoz->caminhoAudio();
            if (null !== $caminho && is_file($caminho)) {
                unlink($caminho);
            }

            $this->livroAudioBlocoVozRepository->remover($blocoVoz, false);
        }

        $this->livroAudioBlocoVozRepository->flush();

        $diretorio = $this->resolverVoz->diretorioVoz($livro, $voz);
        if (is_dir($diretorio) && [] === array_diff(scandir($diretorio) ?: [], ['.', '..'])) {
            rmdir($diretorio);
        }

        return $this->montarLista($livro);
    }

    public function obterAmostra(string $voz): ArquivoMidiaDTO
    {
        $vozCatalogada = VozNarracao::tryFrom($voz);
        $vozPadrao = array_any(IdiomaLivroAudio::cases(), static fn(IdiomaLivroAudio $idioma): bool => $idioma->voz() === $voz);
        if (null === $vozCatalogada && !$vozPadrao) {
            throw LivroAudioException::vozIndisponivel($voz);
        }

        $caminho = sprintf('%s/amostras/%s.mp3', $this->diretorioBaseLivros, $voz);

        if (!is_file($caminho)) {
            $diretorio = dirname($caminho);
            if (!is_dir($diretorio) && !mkdir($diretorio, 0o775, true) && !is_dir($diretorio)) {
                throw LivroAudioException::falhaAoGerarAmostra($voz);
            }

            try {
                $this->sintetizadorVoz->sintetizar(self::TEXTO_AMOSTRA, $caminho, $voz);
            } catch (Throwable) {
                if (is_file($caminho)) {
                    unlink($caminho);
                }

                throw LivroAudioException::falhaAoGerarAmostra($voz);
            }
        }

        return new ArquivoMidiaDTO(
            caminhoFisico: $caminho,
            nomeArquivo: sprintf('amostra_%s.mp3', $voz),
            mimeType: self::MIME_TYPE_AUDIO,
        );
    }

    private function validarEspacoParaVoz(LivroAudio $livro): void
    {
        $necessario = $this->tamanhoVozPrincipal($livro);
        $disco = $this->painelSistema->disco($necessario);
        if ('critico' === $disco['nivel']) {
            throw LivroAudioException::espacoInsuficienteParaVoz($necessario, $disco['livreBytes']);
        }
    }

    private function tamanhoVozPrincipal(LivroAudio $livro): int
    {
        $total = 0;
        foreach ($this->livroAudioBlocoRepository->listarPorLivro($livro) as $bloco) {
            $total += $bloco->tamanhoBytes() ?? 0;
        }

        return $total;
    }

    private function validarVozAdicional(LivroAudio $livro, string $voz): void
    {
        $vozCatalogada = VozNarracao::tryFrom($voz);
        $idioma = $livro->idioma() ?? IdiomaLivroAudio::PT;

        if (null === $vozCatalogada || !$vozCatalogada->atendeIdioma($idioma) || $voz === $this->resolverVoz->vozPrincipal($livro)) {
            throw LivroAudioException::vozIndisponivel($voz);
        }
    }

    /**
     * @return list<array{id: string, nome: string, descricao: string, principal: bool, motor: string, status: string, totalBlocos: int, blocosProntos: list<int>, blocosComErro: int, tamanhoBytes: int, tamanhoEstimadoBytes: int}>
     */
    private function montarLista(LivroAudio $livro): array
    {
        $blocos = $this->livroAudioBlocoRepository->listarPorLivro($livro);
        $totalBlocos = count($blocos);
        $vozPrincipal = $this->resolverVoz->vozPrincipal($livro);
        $idioma = $livro->idioma() ?? IdiomaLivroAudio::PT;

        $statusPorVoz = [$vozPrincipal => []];
        $bytesPorVoz = [$vozPrincipal => 0];
        foreach ($blocos as $bloco) {
            $statusPorVoz[$vozPrincipal][$bloco->numeroBloco()] = $bloco->status();
            $bytesPorVoz[$vozPrincipal] += $bloco->tamanhoBytes() ?? 0;
        }
        $estimativaPorParte = $totalBlocos > 0 && count(array_filter($statusPorVoz[$vozPrincipal], static fn(StatusLivroAudioBloco $status): bool => $status->isPronto())) > 0
            ? $bytesPorVoz[$vozPrincipal] / count(array_filter($statusPorVoz[$vozPrincipal], static fn(StatusLivroAudioBloco $status): bool => $status->isPronto()))
            : 0;

        foreach (VozNarracao::disponiveisPara($idioma) as $vozCatalogada) {
            $statusPorVoz[$vozCatalogada->value] ??= [];
        }

        foreach ($this->livroAudioBlocoVozRepository->listarPorLivro($livro) as $blocoVoz) {
            if ($blocoVoz->voz() === $vozPrincipal) {
                continue;
            }

            $statusPorVoz[$blocoVoz->voz()][$blocoVoz->bloco()->numeroBloco()] = $blocoVoz->status();
            $bytesPorVoz[$blocoVoz->voz()] = ($bytesPorVoz[$blocoVoz->voz()] ?? 0) + ($blocoVoz->tamanhoBytes() ?? 0);
        }

        $lista = [];
        foreach ($statusPorVoz as $voz => $statusBlocos) {
            $voz = (string) $voz;
            $prontos = array_keys(array_filter($statusBlocos, static fn(StatusLivroAudioBloco $status): bool => $status->isPronto()));
            $erros = count(array_filter($statusBlocos, static fn(StatusLivroAudioBloco $status): bool => $status->isErro()));

            $lista[] = [
                'id' => $voz,
                'nome' => VozNarracao::nomeDe($voz),
                'descricao' => VozNarracao::tryFrom($voz)?->descricao() ?? 'Voz padrão do idioma do livro',
                'principal' => $voz === $vozPrincipal,
                'motor' => VozNarracao::motorDe($voz),
                'status' => $this->resumirStatus($statusBlocos, $totalBlocos),
                'totalBlocos' => $totalBlocos,
                'blocosProntos' => array_values(array_map('intval', $prontos)),
                'blocosComErro' => $erros,
                'tamanhoBytes' => $bytesPorVoz[$voz] ?? 0,
                'tamanhoEstimadoBytes' => (int) round($estimativaPorParte * $totalBlocos),
            ];
        }

        return $lista;
    }

    /**
     * @param array<int, StatusLivroAudioBloco> $statusBlocos
     */
    private function resumirStatus(array $statusBlocos, int $totalBlocos): string
    {
        if ([] === $statusBlocos) {
            return 'nao_gerada';
        }

        $prontos = count(array_filter($statusBlocos, static fn(StatusLivroAudioBloco $status): bool => $status->isPronto()));
        $finais = count(array_filter($statusBlocos, static fn(StatusLivroAudioBloco $status): bool => $status->isFinal()));

        return match (true) {
            $prontos === $totalBlocos => 'pronta',
            $finais < count($statusBlocos) => 'gerando',
            $prontos > 0 => 'parcial',
            default => 'erro',
        };
    }
}
