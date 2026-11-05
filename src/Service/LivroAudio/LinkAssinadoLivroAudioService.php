<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

use App\Entity\LivroAudio;
use App\Entity\Usuario;
use App\Enum\IdiomaLivroAudio;
use App\Enum\VozNarracao;
use App\Exception\LivroAudio\LivroAudioException;
use App\Repository\LivroAudioBlocoRepository;
use App\Repository\LivroAudioBlocoVozRepository;
use App\Repository\LivroAudioRepository;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\UriSigner;

final readonly class LinkAssinadoLivroAudioService
{
    public const string PREFIXO = '/api/v1/livros-audio-arquivos';
    private const int JANELA_SEGUNDOS = 600;
    private const int JANELAS_DE_VALIDADE = 3;

    public function __construct(
        private UriSigner $uriSigner,
        private ConsultarLivrosAudioService $consultarLivrosAudio,
        private LivroAudioRepository $livroAudioRepository,
        private LivroAudioBlocoRepository $livroAudioBlocoRepository,
        private LivroAudioBlocoVozRepository $livroAudioBlocoVozRepository,
        private ResolverVozLivroAudioService $resolverVoz,
    ) {}

    /**
     * @return list<array{numeroBloco: int, voz: string|null, url: string, expiraEm: int}>
     */
    public function linksDoLivro(string $uuid, Usuario $usuario): array
    {
        $livro = $this->consultarLivrosAudio->obterDoUsuario($uuid, $usuario);
        $links = [];
        $versaoPorBloco = [];

        foreach ($this->livroAudioBlocoRepository->listarPorLivro($livro) as $bloco) {
            $versao = (string) ($bloco->atualizadoEm()->getTimestamp() * 1000);
            $versaoPorBloco[$bloco->numeroBloco()] = $versao;
            if ($bloco->isPronto()) {
                $links[] = ['numeroBloco' => $bloco->numeroBloco(), 'voz' => null] + $this->linkArquivoBloco($livro, $bloco->numeroBloco(), null, $versao);
            }
        }

        $vozPrincipal = $this->resolverVoz->vozPrincipal($livro);
        foreach ($this->livroAudioBlocoVozRepository->listarPorLivro($livro) as $blocoVoz) {
            $voz = $blocoVoz->voz();
            $numero = $blocoVoz->bloco()->numeroBloco();
            if ($voz !== $vozPrincipal && $blocoVoz->isPronto()) {
                $links[] = ['numeroBloco' => $numero, 'voz' => $voz] + $this->linkArquivoBloco($livro, $numero, $voz, $versaoPorBloco[$numero] ?? null);
            }
        }

        return $links;
    }

    /**
     * @return array{url: string, expiraEm: int}
     */
    public function linkPdf(string $uuid, Usuario $usuario): array
    {
        $livro = $this->consultarLivrosAudio->obterDoUsuario($uuid, $usuario);

        return $this->assinar(sprintf('%s/%s/pdf', self::PREFIXO, $livro->uuidTexto()));
    }

    /**
     * @return list<array{voz: string, url: string, expiraEm: int}>
     */
    public function linksAmostras(): array
    {
        $vozes = array_unique([
            ...array_map(static fn(VozNarracao $voz): string => $voz->value, VozNarracao::cases()),
            ...array_map(static fn(IdiomaLivroAudio $idioma): string => $idioma->voz(), IdiomaLivroAudio::cases()),
        ]);

        return array_values(array_map(
            fn(string $voz): array => ['voz' => $voz] + $this->assinar(sprintf('%s/vozes/%s/amostra', self::PREFIXO, rawurlencode($voz))),
            $vozes,
        ));
    }

    /**
     * @return array{url: string, expiraEm: int}
     */
    private function linkArquivoBloco(LivroAudio $livro, int $numeroBloco, ?string $voz, ?string $versao): array
    {
        $parametros = array_filter(['voz' => $voz, 'v' => $versao], static fn(?string $valor): bool => null !== $valor && '' !== $valor);

        return $this->assinar(sprintf('%s/%s/blocos/%d/stream', self::PREFIXO, $livro->uuidTexto(), $numeroBloco), $parametros);
    }

    public function validar(Request $request): void
    {
        $consulta = $request->getQueryString();
        $uri = $request->getPathInfo() . (null !== $consulta && '' !== $consulta ? '?' . $consulta : '');

        if (!$this->uriSigner->check($uri)) {
            throw LivroAudioException::linkInvalido();
        }
    }

    public function livroDoLink(string $uuid): LivroAudio
    {
        return $this->livroAudioRepository->buscarPorUuid($uuid) ?? throw LivroAudioException::livroNaoEncontrado($uuid);
    }

    /**
     * @param array<string, string> $parametros
     *
     * @return array{url: string, expiraEm: int}
     */
    private function assinar(string $caminho, array $parametros = []): array
    {
        $expiraEm = (intdiv(time(), self::JANELA_SEGUNDOS) + self::JANELAS_DE_VALIDADE) * self::JANELA_SEGUNDOS;
        $consulta = [] !== $parametros ? '?' . http_build_query($parametros) : '';

        return [
            'url' => $this->uriSigner->sign($caminho . $consulta, $expiraEm),
            'expiraEm' => $expiraEm,
        ];
    }
}
