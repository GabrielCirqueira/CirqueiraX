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
        private LoggerInterface $logger,
    ) {
    }

    public function executar(BuscarImagemSpotifyMessage $message): void
    {
        $imagem = $this->obterOuCriarImagem($message);
        if ($imagem->isEncontrada()) {
            return;
        }

        if ($imagem->isNaoEncontrada()) {
            $podeRetentar = $message->tipo->isArtista()
                && null !== $imagem->motivoFalha()
                && str_contains($imagem->motivoFalha(), 'requer código');

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
            } catch (\Throwable $e) {
                $this->logger->warning('Não foi possível obter token para resolver imagem do Spotify.', [
                    'usuario' => $message->usuarioId,
                    'erro' => $e->getMessage(),
                ]);

                return;
            }
        }

        $imagem->incrementarTentativas();

        try {
            if ($message->tipo->isFaixa()) {
                $this->resolverFaixa($imagem, $accessToken, $message);
            } else {
                $this->resolverArtista($imagem, $accessToken, $message);
            }

            usleep(self::PAUSA_ENTRE_REQUISICOES_MICROSEGUNDOS);
        } catch (SpotifyException $e) {
            $imagem->marcarNaoEncontrada($e->getMessage());
            $this->logger->warning('Falha na API ao buscar imagem do Spotify.', [
                'chave' => $imagem->chaveBusca(),
                'codigo' => $e->getCode(),
                'erro' => $e->getMessage(),
            ]);
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
            $imagem->marcarNaoEncontrada('Nenhum resultado retornado pela busca no Spotify.');

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

            return;
        }

        $imagem->marcarNaoEncontrada('Nenhum resultado com correspondência suficiente na busca.');
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
            $imagem->marcarNaoEncontrada('Artista não encontrado na busca do Spotify.');

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

            return;
        }

        $imagem->marcarNaoEncontrada('Nenhum artista correspondente encontrado no Spotify.');
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
