<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\FaixaSpotifyDTO;
use App\Entity\ImagemSpotify;
use App\Enum\TipoImagemSpotify;
use App\Exception\Spotify\SpotifyException;
use App\Interface\SpotifyInterface;
use App\Message\BuscarImagemSpotifyMessage;
use App\Repository\ContaSpotifyRepository;
use App\Repository\ImagemSpotifyRepository;
use App\Repository\UsuarioRepository;
use GuzzleHttp\ClientInterface;
use Psr\Log\LoggerInterface;

final readonly class ResolverImagemSpotifyService
{
    private const int PONTUACAO_MINIMA_CORRESPONDENCIA = 70;
    private const int PAUSA_ENTRE_REQUISICOES_MICROSEGUNDOS = 150000;

    public function __construct(
        private ImagemSpotifyRepository $imagemRepository,
        private UsuarioRepository $usuarioRepository,
        private ContaSpotifyRepository $contaSpotifyRepository,
        private ObterTokenValidoSpotifyService $obterTokenValidoService,
        private SpotifyInterface $spotifyClient,
        private ClientInterface $httpClient,
        private LoggerInterface $logger,
    ) {
    }

    public function executar(BuscarImagemSpotifyMessage $message): void
    {
        $imagem = $this->obterOuCriarImagem($message);
        if ($imagem->isEncontrada() && null !== $imagem->primeiraImagemUrl()) {
            return;
        }

        if ($imagem->isNaoEncontrada()) {
            $podeRetentar = $message->tipo->isArtista() && null === $imagem->primeiraImagemUrl();

            if (!$podeRetentar) {
                return;
            }
        }

        $accessToken = null;
        if (null !== $message->usuarioId) {
            $usuario = $this->usuarioRepository->find($message->usuarioId);
            if (null !== $usuario) {
                $conta = $this->contaSpotifyRepository->buscarDoUsuario($usuario);
                if (null !== $conta && $conta->status()->isConectada()) {
                    try {
                        $accessToken = $this->obterTokenValidoService->executar($conta);
                    } catch (SpotifyException) {
                        $accessToken = null;
                    }
                }
            }
        }

        if (null === $accessToken || '' === trim($accessToken)) {
            try {
                $accessToken = $this->spotifyClient->obterTokenClientCredentials();
            } catch (\Throwable) {
                $accessToken = null;
            }
        }

        $imagem->incrementarTentativas();

        if (null !== $accessToken && '' !== trim($accessToken)) {
            try {
                if ($message->tipo->isFaixa()) {
                    $this->resolverFaixa($imagem, $accessToken, $message);
                } else {
                    $this->resolverArtista($imagem, $accessToken, $message);
                }

                usleep(self::PAUSA_ENTRE_REQUISICOES_MICROSEGUNDOS);
            } catch (SpotifyException $e) {
                $this->logger->warning('Falha na API ao buscar imagem do Spotify.', [
                    'chave' => $imagem->chaveBusca(),
                    'codigo' => $e->getCode(),
                    'erro' => $e->getMessage(),
                ]);
            }
        }

        if (null === $imagem->primeiraImagemUrl()) {
            if ($message->tipo->isArtista()) {
                $this->resolverArtistaViaDeezer($imagem, $message->nome);
            } else {
                $this->resolverFaixaViaPublico($imagem, $message);
            }
        }

        if (null === $imagem->primeiraImagemUrl() && !$imagem->isEncontrada()) {
            $imagem->marcarNaoEncontrada('Não foi possível obter imagem.');
        }

        $this->imagemRepository->salvar($imagem);
    }

    private function obterOuCriarImagem(BuscarImagemSpotifyMessage $message): ImagemSpotify
    {
        $chave = $message->tipo->isFaixa()
            ? ImagemSpotify::gerarChaveFaixa($message->codigoSpotify, $message->artista ?? '', $message->nome)
            : ImagemSpotify::gerarChaveArtista($message->codigoSpotify, $message->nome);

        $existente = $this->imagemRepository->buscarPorChaveBusca($chave);
        if (null !== $existente) {
            return $existente;
        }

        $nova = $message->tipo->isFaixa()
            ? ImagemSpotify::criarParaFaixa(
                $message->nome,
                $message->artista ?? '',
                $message->codigoSpotify,
                $message->duracaoMs,
            )
            : ImagemSpotify::criarParaArtista($message->nome, $message->codigoSpotify);

        $this->imagemRepository->salvar($nova);

        return $nova;
    }

    private function resolverFaixa(
        ImagemSpotify $imagem,
        string $accessToken,
        BuscarImagemSpotifyMessage $message,
    ): void {
        if ($message->codigoSpotify !== null && '' !== trim($message->codigoSpotify)) {
            $faixa = $this->spotifyClient->obterFaixa($accessToken, trim($message->codigoSpotify));
            $imagem->marcarEncontrada(
                $faixa->codigoFaixa,
                $faixa->urlCapa,
                $faixa->urlCapaMedia,
                $faixa->urlCapaPequena,
                $faixa->urlSpotify,
            );

            return;
        }

        $artista = $message->artista ?? '';
        $termoBusca = sprintf('track:%s artist:%s', $message->nome, $artista);
        $busca = $this->spotifyClient->buscarFaixas($accessToken, $termoBusca, limite: 10);

        if (empty($busca->faixas)) {
            $busca = $this->spotifyClient->buscarFaixas(
                $accessToken,
                sprintf('%s %s', $message->nome, $artista),
                limite: 10,
            );
        }

        if (empty($busca->faixas)) {
            return;
        }

        $melhorCandidato = null;
        $maiorPontuacao = 0;

        foreach ($busca->faixas as $candidato) {
            $pontos = $this->avaliarCorrespondencia(
                $candidato,
                $artista,
                $message->nome,
                $message->duracaoMs,
            );

            if ($pontos > $maiorPontuacao) {
                $maiorPontuacao = $pontos;
                $melhorCandidato = $candidato;
            }
        }

        if (null !== $melhorCandidato && $maiorPontuacao >= self::PONTUACAO_MINIMA_CORRESPONDENCIA) {
            $imagem->marcarEncontrada(
                $melhorCandidato->codigoFaixa,
                $melhorCandidato->urlCapa,
                $melhorCandidato->urlCapaMedia,
                $melhorCandidato->urlCapaPequena,
                $melhorCandidato->urlSpotify,
            );
        }
    }

    private function resolverArtista(
        ImagemSpotify $imagem,
        string $accessToken,
        BuscarImagemSpotifyMessage $message,
    ): void {
        if ($message->codigoSpotify !== null && '' !== trim($message->codigoSpotify)) {
            $artista = $this->spotifyClient->obterArtista($accessToken, trim($message->codigoSpotify));
            $imagem->marcarEncontrada(
                $artista->codigoArtista,
                $artista->urlFoto,
                $artista->urlFotoMedia,
                $artista->urlFotoPequena,
                $artista->urlSpotify,
            );

            return;
        }

        $artistasBuscados = $this->spotifyClient->buscarArtistas($accessToken, $message->nome, limite: 5);
        if (empty($artistasBuscados)) {
            return;
        }

        $nomeEsperadoNorm = $this->normalizarTexto($message->nome);
        $melhorCandidato = null;
        $maiorSimilaridade = 0.0;

        foreach ($artistasBuscados as $candidato) {
            $nomeCandidatoNorm = $this->normalizarTexto($candidato->nome);
            if ($nomeCandidatoNorm === $nomeEsperadoNorm) {
                $melhorCandidato = $candidato;
                break;
            }

            similar_text($nomeEsperadoNorm, $nomeCandidatoNorm, $porcentagem);
            if ($porcentagem > $maiorSimilaridade) {
                $maiorSimilaridade = $porcentagem;
                $melhorCandidato = $candidato;
            }
        }

        if (null !== $melhorCandidato && ($melhorCandidato->urlFoto !== null || $melhorCandidato->urlFotoMedia !== null)) {
            $imagem->marcarEncontrada(
                $melhorCandidato->codigoArtista,
                $melhorCandidato->urlFoto,
                $melhorCandidato->urlFotoMedia,
                $melhorCandidato->urlFotoPequena,
                $melhorCandidato->urlSpotify,
            );

            return;
        }

        if (null !== $melhorCandidato) {
            $imagem->marcarEncontrada(
                $melhorCandidato->codigoArtista,
                null,
                null,
                null,
                $melhorCandidato->urlSpotify,
            );
        }
    }

    private function resolverArtistaViaDeezer(ImagemSpotify $imagem, string $nomeArtista): bool
    {
        try {
            $resposta = $this->httpClient->request('GET', 'https://api.deezer.com/search/artist', [
                'query' => ['q' => $nomeArtista],
                'timeout' => 5,
            ]);

            /** @var array{data?: array<int, array<string, mixed>>} $corpo */
            $corpo = json_decode($resposta->getBody()->getContents(), true);
            if (!is_array($corpo) || empty($corpo['data']) || !is_array($corpo['data'])) {
                return false;
            }

            $nomeEsperadoNorm = $this->normalizarTexto($nomeArtista);
            $melhorCandidato = null;
            $maiorSimilaridade = 0.0;

            foreach ($corpo['data'] as $candidato) {
                if (!is_array($candidato) || empty($candidato['name'])) {
                    continue;
                }
                $nomeCandNorm = $this->normalizarTexto((string) $candidato['name']);
                if ($nomeCandNorm === $nomeEsperadoNorm) {
                    $melhorCandidato = $candidato;
                    break;
                }

                similar_text($nomeEsperadoNorm, $nomeCandNorm, $porcentagem);
                if ($porcentagem > $maiorSimilaridade) {
                    $maiorSimilaridade = $porcentagem;
                    $melhorCandidato = $candidato;
                }
            }

            if (null === $melhorCandidato) {
                return false;
            }

            $grande = isset($melhorCandidato['picture_xl']) && is_string($melhorCandidato['picture_xl'])
                ? $melhorCandidato['picture_xl']
                : (isset($melhorCandidato['picture_big']) && is_string($melhorCandidato['picture_big']) ? $melhorCandidato['picture_big'] : null);

            $media = isset($melhorCandidato['picture_medium']) && is_string($melhorCandidato['picture_medium'])
                ? $melhorCandidato['picture_medium']
                : null;

            $pequena = isset($melhorCandidato['picture_small']) && is_string($melhorCandidato['picture_small'])
                ? $melhorCandidato['picture_small']
                : null;

            if (null === $grande && null === $media) {
                return false;
            }

            $urlSpotify = $imagem->urlSpotify() ?? ImagemSpotify::gerarUrlSpotifyArtista($imagem->codigoSpotify(), $nomeArtista);

            $imagem->marcarEncontrada(
                $imagem->codigoSpotify(),
                $grande,
                $media ?? $grande,
                $pequena ?? $media ?? $grande,
                $urlSpotify,
            );

            return true;
        } catch (\Throwable $e) {
            $this->logger->warning('Falha ao resolver imagem de artista via Deezer.', [
                'artista' => $nomeArtista,
                'erro' => $e->getMessage(),
            ]);

            return false;
        }
    }

    private function resolverFaixaViaPublico(ImagemSpotify $imagem, BuscarImagemSpotifyMessage $message): bool
    {
        if ($message->codigoSpotify !== null && '' !== trim($message->codigoSpotify)) {
            try {
                $resposta = $this->httpClient->request('GET', 'https://open.spotify.com/oembed', [
                    'query' => ['url' => 'https://open.spotify.com/track/' . trim($message->codigoSpotify)],
                    'timeout' => 5,
                ]);

                /** @var array{thumbnail_url?: string} $corpo */
                $corpo = json_decode($resposta->getBody()->getContents(), true);
                if (is_array($corpo) && !empty($corpo['thumbnail_url']) && is_string($corpo['thumbnail_url'])) {
                    $url = $corpo['thumbnail_url'];
                    $urlSpotify = 'https://open.spotify.com/track/' . trim($message->codigoSpotify);
                    $imagem->marcarEncontrada(
                        trim($message->codigoSpotify),
                        $url,
                        $url,
                        $url,
                        $urlSpotify,
                    );

                    return true;
                }
            } catch (\Throwable) {
            }
        }

        try {
            $termo = trim(($message->artista ?? '') . ' ' . $message->nome);
            $resposta = $this->httpClient->request('GET', 'https://api.deezer.com/search', [
                'query' => ['q' => $termo, 'limit' => 5],
                'timeout' => 5,
            ]);

            /** @var array{data?: array<int, array<string, mixed>>} $corpo */
            $corpo = json_decode($resposta->getBody()->getContents(), true);
            if (is_array($corpo) && !empty($corpo['data']) && is_array($corpo['data'])) {
                $primeiro = $corpo['data'][0];
                if (is_array($primeiro) && isset($primeiro['album']) && is_array($primeiro['album'])) {
                    $album = $primeiro['album'];
                    $grande = isset($album['cover_big']) && is_string($album['cover_big'])
                        ? $album['cover_big']
                        : (isset($album['cover_xl']) && is_string($album['cover_xl']) ? $album['cover_xl'] : null);
                    $media = isset($album['cover_medium']) && is_string($album['cover_medium']) ? $album['cover_medium'] : null;
                    $pequena = isset($album['cover_small']) && is_string($album['cover_small']) ? $album['cover_small'] : null;

                    if ($grande !== null || $media !== null) {
                        $urlSpotify = $imagem->urlSpotify() ?? ImagemSpotify::gerarUrlSpotifyFaixa($message->codigoSpotify, $message->artista ?? '', $message->nome);
                        $imagem->marcarEncontrada(
                            $message->codigoSpotify,
                            $grande,
                            $media ?? $grande,
                            $pequena ?? $media ?? $grande,
                            $urlSpotify,
                        );

                        return true;
                    }
                }
            }
        } catch (\Throwable) {
        }

        return false;
    }

    private function avaliarCorrespondencia(
        FaixaSpotifyDTO $candidato,
        string $artistaEsperado,
        string $nomeEsperado,
        ?int $duracaoEsperadaMs,
    ): int {
        $artistaCand = $this->normalizarTexto($candidato->artistaPrincipal);
        $nomeCand = $this->normalizarTexto($candidato->nome);
        $artistaEsp = $this->normalizarTexto($artistaEsperado);
        $nomeEsp = $this->normalizarTexto($nomeEsperado);

        $pontuacao = 0;

        $artistaCasou = $artistaCand === $artistaEsp
            || str_contains($artistaCand, $artistaEsp)
            || str_contains($artistaEsp, $artistaCand);

        if ($artistaCasou) {
            $pontuacao += 50;
        } else {
            similar_text($artistaCand, $artistaEsp, $percentArtista);
            if ($percentArtista >= 75) {
                $pontuacao += 35;
            }
        }

        if ($nomeCand === $nomeEsp || str_contains($nomeCand, $nomeEsp) || str_contains($nomeEsp, $nomeCand)) {
            $pontuacao += 30;
        } else {
            similar_text($nomeCand, $nomeEsp, $percentNome);
            if ($percentNome >= 75) {
                $pontuacao += 20;
            }
        }

        if ($duracaoEsperadaMs !== null && $duracaoEsperadaMs > 0 && $candidato->duracaoMs > 0) {
            $diffMs = abs($candidato->duracaoMs - $duracaoEsperadaMs);
            if ($diffMs <= 15000) {
                $pontuacao += 20;
            } elseif ($diffMs <= 30000) {
                $pontuacao += 10;
            }
        } else {
            $pontuacao += 10;
        }

        return $pontuacao;
    }

    private function normalizarTexto(string $texto): string
    {
        $texto = mb_strtolower(trim($texto));
        $texto = preg_replace('/[^\p{L}\p{N}\s]/u', '', $texto) ?? $texto;

        return trim(preg_replace('/\s+/', ' ', $texto) ?? $texto);
    }
}
