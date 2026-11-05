<?php

declare(strict_types=1);

namespace App\Infra\Spotify;

use App\DataObject\Spotify\ArtistaSpotifyDTO;
use App\DataObject\Spotify\BuscaFaixasSpotifyDTO;
use App\DataObject\Spotify\FaixaSpotifyDTO;
use App\DataObject\Spotify\ItemReproducaoRecenteDTO;
use App\DataObject\Spotify\ListaReproducoesRecentesSpotifyDTO;
use App\DataObject\Spotify\PerfilSpotifyDTO;
use App\DataObject\Spotify\TokensSpotifyDTO;
use App\Exception\Spotify\SpotifyException;
use App\Infra\Client;
use App\Interface\SpotifyInterface;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\BadResponseException;
use GuzzleHttp\Exception\RequestException;
use Symfony\Component\Serializer\SerializerInterface;
use Webmozart\Assert\Assert;

final class SpotifyClient extends Client implements SpotifyInterface
{
    private const int TIMEOUT_SEGUNDOS = 15;
    private const int MAX_TENTATIVAS_RATE_LIMIT = 3;
    private const int ESPERA_PADRAO_RATE_LIMIT_SEGUNDOS = 2;
    private const int LIMITE_PADRAO_RECENTES = 50;
    private const int LIMITE_MAXIMO_BUSCA = 10;

    private ?string $tokenClientCredentialsCache = null;
    private ?int $tokenClientCredentialsExpiraEm = null;

    public function __construct(
        ClientInterface $client,
        private readonly string $clientId,
        private readonly string $clientSecret,
        private readonly string $redirectUri,
        string $baseUrl = 'https://api.spotify.com/v1',
        private readonly string $urlAutorizacao = 'https://accounts.spotify.com/authorize',
        private readonly string $urlToken = 'https://accounts.spotify.com/api/token',
        ?SerializerInterface $serializer = null,
    ) {
        parent::__construct($client, $baseUrl, $serializer);
    }

    /**
     * @param array<int, string> $escopos
     */
    public function gerarUrlAutorizacao(string $state, array $escopos): string
    {
        $this->validarCredenciaisConfiguradas();

        $parametros = [
            'client_id' => $this->clientId,
            'response_type' => 'code',
            'redirect_uri' => $this->redirectUri,
            'state' => $state,
            'scope' => implode(' ', $escopos),
            'show_dialog' => 'true',
        ];

        return $this->urlAutorizacao.'?'.http_build_query($parametros);
    }

    public function trocarCodigoPorTokens(string $code): TokensSpotifyDTO
    {
        $this->validarCredenciaisConfiguradas();

        $autorizacaoBasic = base64_encode($this->clientId.':'.$this->clientSecret);

        $dados = $this->executarComRetry(function () use ($code, $autorizacaoBasic) {
            /** @var array<string, mixed> $resposta */
            $resposta = $this->request(
                'POST',
                $this->urlToken,
                [
                    'timeout' => self::TIMEOUT_SEGUNDOS,
                    'headers' => [
                        'Authorization' => 'Basic '.$autorizacaoBasic,
                        'Content-Type' => 'application/x-www-form-urlencoded',
                    ],
                    'form_params' => [
                        'grant_type' => 'authorization_code',
                        'code' => $code,
                        'redirect_uri' => $this->redirectUri,
                    ],
                ],
                throw: static fn (RequestException $e): \Throwable => $e,
            );

            return $resposta;
        }, SpotifyException::falhaNaTrocaDeCodigoPorTokens());

        Assert::keyExists($dados, 'access_token');

        $accessToken = $this->extrairString($dados['access_token'] ?? null);
        $refreshToken = isset($dados['refresh_token']) && is_string($dados['refresh_token']) ? $dados['refresh_token'] : null;
        $expiraEm = $this->extrairInt($dados['expires_in'] ?? null, 3600);
        $escopos = $this->extrairString($dados['scope'] ?? null);

        return new TokensSpotifyDTO($accessToken, $refreshToken, $expiraEm, $escopos);
    }

    public function renovarToken(string $refreshToken): TokensSpotifyDTO
    {
        $this->validarCredenciaisConfiguradas();

        $autorizacaoBasic = base64_encode($this->clientId.':'.$this->clientSecret);

        $dados = $this->executarComRetry(function () use ($refreshToken, $autorizacaoBasic) {
            /** @var array<string, mixed> $resposta */
            $resposta = $this->request(
                'POST',
                $this->urlToken,
                [
                    'timeout' => self::TIMEOUT_SEGUNDOS,
                    'headers' => [
                        'Authorization' => 'Basic '.$autorizacaoBasic,
                        'Content-Type' => 'application/x-www-form-urlencoded',
                    ],
                    'form_params' => [
                        'grant_type' => 'refresh_token',
                        'refresh_token' => $refreshToken,
                    ],
                ],
                throw: static fn (RequestException $e): \Throwable => $e,
            );

            return $resposta;
        }, SpotifyException::falhaNaRenovacaoDeToken());

        Assert::keyExists($dados, 'access_token');

        $accessToken = $this->extrairString($dados['access_token'] ?? null);
        $novoRefreshToken = isset($dados['refresh_token']) && is_string($dados['refresh_token']) ? $dados['refresh_token'] : $refreshToken;
        $expiraEm = $this->extrairInt($dados['expires_in'] ?? null, 3600);
        $escopos = $this->extrairString($dados['scope'] ?? null);

        return new TokensSpotifyDTO($accessToken, $novoRefreshToken, $expiraEm, $escopos);
    }

    public function obterTokenClientCredentials(): string
    {
        if (null !== $this->tokenClientCredentialsCache && time() < ($this->tokenClientCredentialsExpiraEm ?? 0) - 60) {
            return $this->tokenClientCredentialsCache;
        }

        $this->validarCredenciaisConfiguradas();

        $autorizacaoBasic = base64_encode($this->clientId.':'.$this->clientSecret);

        $dados = $this->executarComRetry(function () use ($autorizacaoBasic) {
            /** @var array<string, mixed> $resposta */
            $resposta = $this->request(
                'POST',
                $this->urlToken,
                [
                    'timeout' => self::TIMEOUT_SEGUNDOS,
                    'headers' => [
                        'Authorization' => 'Basic '.$autorizacaoBasic,
                        'Content-Type' => 'application/x-www-form-urlencoded',
                    ],
                    'form_params' => [
                        'grant_type' => 'client_credentials',
                    ],
                ],
                throw: static fn (RequestException $e): \Throwable => $e,
            );

            return $resposta;
        }, SpotifyException::falhaNaTrocaDeCodigoPorTokens());

        Assert::keyExists($dados, 'access_token');

        $this->tokenClientCredentialsCache = $this->extrairString($dados['access_token'] ?? null);
        $expiraEm = $this->extrairInt($dados['expires_in'] ?? null, 3600);
        $this->tokenClientCredentialsExpiraEm = time() + $expiraEm;

        return $this->tokenClientCredentialsCache;
    }

    public function buscarPerfil(string $accessToken): PerfilSpotifyDTO
    {
        $dados = $this->executarComRetry(function () use ($accessToken) {
            /** @var array<string, mixed> $resposta */
            $resposta = $this->request(
                'GET',
                $this->resolverUrl('/me'),
                [
                    'timeout' => self::TIMEOUT_SEGUNDOS,
                    'headers' => [
                        'Authorization' => 'Bearer '.$accessToken,
                        'Accept' => 'application/json',
                    ],
                ],
                throw: static fn (RequestException $e): \Throwable => $e,
            );

            return $resposta;
        });

        Assert::keyExists($dados, 'id');

        $id = $this->extrairString($dados['id'] ?? null);
        $displayName = $this->extrairString($dados['display_name'] ?? null);
        $nome = '' !== $displayName ? $displayName : $id;
        $urlFoto = $this->extrairPrimeiraImagem($dados['images'] ?? []);

        return new PerfilSpotifyDTO($id, $nome, $urlFoto);
    }

    public function listarReproducoesRecentes(string $accessToken, ?int $depoisDe = null, int $limite = 50): ListaReproducoesRecentesSpotifyDTO
    {
        $limiteSanitizado = max(1, min($limite, self::LIMITE_PADRAO_RECENTES));

        $query = [
            'limit' => $limiteSanitizado,
        ];

        if (null !== $depoisDe && $depoisDe > 0) {
            $query['after'] = $depoisDe;
        }

        $dados = $this->executarComRetry(function () use ($accessToken, $query) {
            /** @var array<string, mixed> $resposta */
            $resposta = $this->request(
                'GET',
                $this->resolverUrl('/me/player/recently-played'),
                [
                    'timeout' => self::TIMEOUT_SEGUNDOS,
                    'headers' => [
                        'Authorization' => 'Bearer '.$accessToken,
                        'Accept' => 'application/json',
                    ],
                    'query' => $query,
                ],
                throw: static fn (RequestException $e): \Throwable => $e,
            );

            return $resposta;
        });

        $itensBrutos = isset($dados['items']) && is_array($dados['items']) ? $dados['items'] : [];
        $itensMapeados = [];

        foreach ($itensBrutos as $itemBruto) {
            if (!is_array($itemBruto)) {
                continue;
            }

            $itemMapeado = $this->mapearItemReproducaoRecente($itemBruto);
            if (null !== $itemMapeado) {
                $itensMapeados[] = $itemMapeado;
            }
        }

        $cursors = isset($dados['cursors']) && is_array($dados['cursors']) ? $dados['cursors'] : [];
        $cursorAfterMs = isset($cursors['after']) && is_numeric($cursors['after']) ? (int) $cursors['after'] : null;

        return new ListaReproducoesRecentesSpotifyDTO($itensMapeados, $cursorAfterMs);
    }

    public function obterFaixa(string $accessToken, string $idFaixa): FaixaSpotifyDTO
    {
        $dados = $this->executarComRetry(function () use ($accessToken, $idFaixa) {
            /** @var array<string, mixed> $resposta */
            $resposta = $this->request(
                'GET',
                $this->resolverUrl('/tracks/'.rawurlencode($idFaixa)),
                [
                    'timeout' => self::TIMEOUT_SEGUNDOS,
                    'headers' => [
                        'Authorization' => 'Bearer '.$accessToken,
                        'Accept' => 'application/json',
                    ],
                ],
                throw: static fn (RequestException $e): \Throwable => $e,
            );

            return $resposta;
        });

        return $this->mapearFaixa($dados);
    }

    public function obterArtista(string $accessToken, string $idArtista): ArtistaSpotifyDTO
    {
        $dados = $this->executarComRetry(function () use ($accessToken, $idArtista) {
            /** @var array<string, mixed> $resposta */
            $resposta = $this->request(
                'GET',
                $this->resolverUrl('/artists/'.rawurlencode($idArtista)),
                [
                    'timeout' => self::TIMEOUT_SEGUNDOS,
                    'headers' => [
                        'Authorization' => 'Bearer '.$accessToken,
                        'Accept' => 'application/json',
                    ],
                ],
                throw: static fn (RequestException $e): \Throwable => $e,
            );

            return $resposta;
        });

        $codigo = $this->extrairString($dados['id'] ?? null, $idArtista);
        $nome = $this->extrairString($dados['name'] ?? null);
        $imagens = $this->extrairTresImagens($dados['images'] ?? []);
        $generos = isset($dados['genres']) && is_array($dados['genres']) ? array_values(array_map('strval', $dados['genres'])) : [];
        $urlSpotify = $this->extrairUrlSpotify($dados['external_urls'] ?? null, 'artist', $codigo);

        return new ArtistaSpotifyDTO(
            codigoArtista: $codigo,
            nome: $nome,
            urlFoto: $imagens['grande'],
            generos: $generos,
            urlFotoMedia: $imagens['media'],
            urlFotoPequena: $imagens['pequena'],
            urlSpotify: $urlSpotify,
        );
    }

    /**
     * @return array<int, ArtistaSpotifyDTO>
     */
    public function buscarArtistas(string $accessToken, string $nome, int $limite = 5): array
    {
        $limiteSanitizado = max(1, min($limite, self::LIMITE_MAXIMO_BUSCA));

        $dados = $this->executarComRetry(function () use ($accessToken, $nome, $limiteSanitizado) {
            /** @var array<string, mixed> $resposta */
            $resposta = $this->request(
                'GET',
                $this->resolverUrl('/search'),
                [
                    'timeout' => self::TIMEOUT_SEGUNDOS,
                    'headers' => [
                        'Authorization' => 'Bearer '.$accessToken,
                        'Accept' => 'application/json',
                    ],
                    'query' => [
                        'type' => 'artist',
                        'q' => $nome,
                        'limit' => $limiteSanitizado,
                    ],
                ],
                throw: static fn (RequestException $e): \Throwable => $e,
            );

            return $resposta;
        });

        $artists = isset($dados['artists']) && is_array($dados['artists']) ? $dados['artists'] : [];
        $itensBrutos = isset($artists['items']) && is_array($artists['items']) ? $artists['items'] : [];
        $artistas = [];

        foreach ($itensBrutos as $itemBruto) {
            if (!is_array($itemBruto)) {
                continue;
            }

            $codigo = $this->extrairString($itemBruto['id'] ?? null);
            $nomeArtista = $this->extrairString($itemBruto['name'] ?? null);
            $imagens = $this->extrairTresImagens($itemBruto['images'] ?? []);
            $generos = isset($itemBruto['genres']) && is_array($itemBruto['genres'])
                ? array_values(array_map('strval', $itemBruto['genres']))
                : [];
            $urlSpotify = $this->extrairUrlSpotify($itemBruto['external_urls'] ?? null, 'artist', $codigo);

            $artistas[] = new ArtistaSpotifyDTO(
                codigoArtista: $codigo,
                nome: $nomeArtista,
                urlFoto: $imagens['grande'],
                generos: $generos,
                urlFotoMedia: $imagens['media'],
                urlFotoPequena: $imagens['pequena'],
                urlSpotify: $urlSpotify,
            );
        }

        return $artistas;
    }

    public function buscarFaixas(string $accessToken, string $texto, int $limite = 10): BuscaFaixasSpotifyDTO
    {
        $limiteSanitizado = max(1, min($limite, self::LIMITE_MAXIMO_BUSCA));

        $dados = $this->executarComRetry(function () use ($accessToken, $texto, $limiteSanitizado) {
            /** @var array<string, mixed> $resposta */
            $resposta = $this->request(
                'GET',
                $this->resolverUrl('/search'),
                [
                    'timeout' => self::TIMEOUT_SEGUNDOS,
                    'headers' => [
                        'Authorization' => 'Bearer '.$accessToken,
                        'Accept' => 'application/json',
                    ],
                    'query' => [
                        'type' => 'track',
                        'q' => $texto,
                        'limit' => $limiteSanitizado,
                    ],
                ],
                throw: static fn (RequestException $e): \Throwable => $e,
            );

            return $resposta;
        });

        $tracks = isset($dados['tracks']) && is_array($dados['tracks']) ? $dados['tracks'] : [];
        $itensBrutos = isset($tracks['items']) && is_array($tracks['items']) ? $tracks['items'] : [];
        $faixas = [];

        foreach ($itensBrutos as $itemBruto) {
            if (is_array($itemBruto)) {
                $faixas[] = $this->mapearFaixa($itemBruto);
            }
        }

        return new BuscaFaixasSpotifyDTO($faixas);
    }

    /**
     * @template T
     *
     * @param callable(): T $operacao
     *
     * @return T
     */
    private function executarComRetry(callable $operacao, ?\Throwable $excecaoPadrao = null): mixed
    {
        $tentativa = 1;

        while ($tentativa <= self::MAX_TENTATIVAS_RATE_LIMIT) {
            try {
                return $operacao();
            } catch (BadResponseException $e) {
                $response = $e->getResponse();
                $statusCode = $response->getStatusCode();

                if (429 === $statusCode) {
                    $retryAfter = $this->extrairSegundosRetryAfter($e);
                    if ($tentativa < self::MAX_TENTATIVAS_RATE_LIMIT) {
                        sleep($retryAfter);
                        ++$tentativa;
                        continue;
                    }

                    throw SpotifyException::limiteRequisicoesExcedido($retryAfter);
                }

                if (401 === $statusCode) {
                    throw SpotifyException::tokenInvalidoOuExpirado();
                }

                if (403 === $statusCode) {
                    throw SpotifyException::contaNaoAutorizadaNoModoDesenvolvimento();
                }

                if ($statusCode >= 500 && $statusCode <= 599) {
                    if ($tentativa < self::MAX_TENTATIVAS_RATE_LIMIT) {
                        sleep(1);
                        ++$tentativa;
                        continue;
                    }

                    throw SpotifyException::falhaServicoSpotify();
                }

                if (null !== $excecaoPadrao) {
                    throw $excecaoPadrao;
                }

                throw SpotifyException::respostaInesperadaDoSpotify();
            } catch (RequestException $e) {
                if (null !== $excecaoPadrao) {
                    throw $excecaoPadrao;
                }

                throw SpotifyException::respostaInesperadaDoSpotify();
            } catch (\Throwable $e) {
                if ($e instanceof SpotifyException) {
                    throw $e;
                }

                if (null !== $excecaoPadrao) {
                    throw $excecaoPadrao;
                }

                throw SpotifyException::respostaInesperadaDoSpotify();
            }
        }

        throw SpotifyException::limiteRequisicoesExcedido(self::ESPERA_PADRAO_RATE_LIMIT_SEGUNDOS);
    }

    private function extrairSegundosRetryAfter(BadResponseException $e): int
    {
        $response = $e->getResponse();
        if ($response->hasHeader('Retry-After')) {
            $valorHeader = (int) $response->getHeaderLine('Retry-After');
            if ($valorHeader > 0) {
                return $valorHeader;
            }
        }

        return self::ESPERA_PADRAO_RATE_LIMIT_SEGUNDOS;
    }

    private function validarCredenciaisConfiguradas(): void
    {
        if ('' === trim($this->clientId) || '' === trim($this->clientSecret)) {
            throw SpotifyException::credenciaisNaoConfiguradas();
        }
    }

    /**
     * @param array<string, mixed> $itemBruto
     */
    private function mapearItemReproducaoRecente(array $itemBruto): ?ItemReproducaoRecenteDTO
    {
        if (!isset($itemBruto['track']) || !is_array($itemBruto['track'])) {
            return null;
        }

        $track = $itemBruto['track'];
        $playedAtString = isset($itemBruto['played_at']) && is_string($itemBruto['played_at']) ? $itemBruto['played_at'] : null;

        if (null === $playedAtString) {
            return null;
        }

        $tocadoEm = \DateTimeImmutable::createFromFormat(\DateTimeInterface::ATOM, $playedAtString);
        if (false === $tocadoEm) {
            $tocadoEm = new \DateTimeImmutable($playedAtString);
        }

        $codigoFaixa = isset($track['id']) && is_string($track['id']) ? $track['id'] : null;
        $nomeFaixa = $this->extrairString($track['name'] ?? null);
        $duracaoMs = $this->extrairInt($track['duration_ms'] ?? null);

        $artistas = isset($track['artists']) && is_array($track['artists']) ? $track['artists'] : [];
        $artistaPrincipal = '';
        $codigoArtistaPrincipal = null;
        $demaisArtistas = [];

        foreach ($artistas as $indice => $artista) {
            if (!is_array($artista) || empty($artista['name'])) {
                continue;
            }

            if (0 === $indice) {
                $artistaPrincipal = $this->extrairString($artista['name']);
                $codigoArtistaPrincipal = isset($artista['id']) && is_string($artista['id']) ? $artista['id'] : null;
            } else {
                $demaisArtistas[] = $this->extrairString($artista['name']);
            }
        }

        $album = isset($track['album']) && is_array($track['album']) ? $track['album'] : [];
        $nomeAlbum = $this->extrairString($album['name'] ?? null);
        $urlCapa = $this->extrairPrimeiraImagem($album['images'] ?? []);

        return new ItemReproducaoRecenteDTO(
            $codigoFaixa,
            $nomeFaixa,
            $artistaPrincipal,
            $codigoArtistaPrincipal,
            $demaisArtistas,
            $nomeAlbum,
            $urlCapa,
            $duracaoMs,
            $tocadoEm
        );
    }

    /**
     * @param array<string, mixed> $dados
     */
    private function mapearFaixa(array $dados): FaixaSpotifyDTO
    {
        $codigoFaixa = $this->extrairString($dados['id'] ?? null);
        $nome = $this->extrairString($dados['name'] ?? null);
        $duracaoMs = $this->extrairInt($dados['duration_ms'] ?? null);

        $artistas = isset($dados['artists']) && is_array($dados['artists']) ? $dados['artists'] : [];
        $artistaPrincipal = '';
        $codigoArtistaPrincipal = null;
        $demaisArtistas = [];

        foreach ($artistas as $indice => $artista) {
            if (!is_array($artista) || empty($artista['name'])) {
                continue;
            }

            if (0 === $indice) {
                $artistaPrincipal = $this->extrairString($artista['name']);
                $codigoArtistaPrincipal = isset($artista['id']) && is_string($artista['id']) ? $artista['id'] : null;
            } else {
                $demaisArtistas[] = $this->extrairString($artista['name']);
            }
        }

        $album = isset($dados['album']) && is_array($dados['album']) ? $dados['album'] : [];
        $nomeAlbum = $this->extrairString($album['name'] ?? null);
        $imagens = $this->extrairTresImagens($album['images'] ?? []);
        $urlSpotify = $this->extrairUrlSpotify($dados['external_urls'] ?? null, 'track', $codigoFaixa);

        return new FaixaSpotifyDTO(
            codigoFaixa: $codigoFaixa,
            nome: $nome,
            artistaPrincipal: $artistaPrincipal,
            codigoArtistaPrincipal: $codigoArtistaPrincipal,
            demaisArtistas: $demaisArtistas,
            nomeAlbum: $nomeAlbum,
            urlCapa: $imagens['grande'],
            duracaoMs: $duracaoMs,
            urlCapaMedia: $imagens['media'],
            urlCapaPequena: $imagens['pequena'],
            urlSpotify: $urlSpotify,
        );
    }

    /**
     * @return array{grande: ?string, media: ?string, pequena: ?string}
     */
    private function extrairTresImagens(mixed $imagens): array
    {
        if (!is_array($imagens) || empty($imagens)) {
            return ['grande' => null, 'media' => null, 'pequena' => null];
        }

        $urls = [];
        foreach ($imagens as $img) {
            if (is_array($img) && !empty($img['url']) && is_string($img['url'])) {
                $urls[] = $img['url'];
            }
        }

        if (empty($urls)) {
            return ['grande' => null, 'media' => null, 'pequena' => null];
        }

        $qtd = count($urls);
        if (1 === $qtd) {
            return ['grande' => $urls[0], 'media' => $urls[0], 'pequena' => $urls[0]];
        }
        if (2 === $qtd) {
            return ['grande' => $urls[0], 'media' => $urls[1], 'pequena' => $urls[1]];
        }

        return ['grande' => $urls[0], 'media' => $urls[1], 'pequena' => $urls[2]];
    }

    private function extrairUrlSpotify(mixed $externalUrls, string $tipo, string $codigo): string
    {
        if (is_array($externalUrls) && !empty($externalUrls['spotify']) && is_string($externalUrls['spotify'])) {
            return $externalUrls['spotify'];
        }

        return 'https://open.spotify.com/' . $tipo . '/' . rawurlencode($codigo);
    }

    private function extrairPrimeiraImagem(mixed $imagens): ?string
    {
        if (!is_array($imagens) || empty($imagens)) {
            return null;
        }

        $primeira = reset($imagens);
        if (is_array($primeira) && !empty($primeira['url']) && is_string($primeira['url'])) {
            return $primeira['url'];
        }

        return null;
    }

    private function extrairString(mixed $valor, string $padrao = ''): string
    {
        return is_string($valor) ? $valor : $padrao;
    }

    private function extrairInt(mixed $valor, int $padrao = 0): int
    {
        return is_numeric($valor) ? (int) $valor : $padrao;
    }
}
