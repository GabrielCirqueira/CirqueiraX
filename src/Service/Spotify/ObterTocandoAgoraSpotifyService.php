<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\DataObject\Spotify\TocandoAgoraSpotifyDTO;
use App\Entity\Usuario;
use App\Enum\OrigemConsultaSpotify;
use App\Exception\Spotify\SpotifyException;
use App\Interface\SpotifyInterface;
use App\Repository\AnaliseReproducaoSpotifyRepository;
use App\Repository\ContaSpotifyRepository;
use Psr\Cache\CacheItemPoolInterface;
use Psr\Log\LoggerInterface;

final readonly class ObterTocandoAgoraSpotifyService
{
    private const int CODIGO_LIMITE_REQUISICOES = 429;
    private const int INTERVALO_CONSULTA_SEGUNDOS = 0;
    private const string PREFIXO_CACHE = 'spotify_tocando_agora_usuario_';
    private const int VALIDADE_CACHE_SEGUNDOS = 4;
    private const int MS_POR_SEGUNDO = 1000;

    public function __construct(
        private ContaSpotifyRepository $contaSpotifyRepository,
        private ObterTokenValidoSpotifyService $obterTokenValidoService,
        private SpotifyInterface $spotifyClient,
        private AnaliseReproducaoSpotifyRepository $analiseRepository,
        private LoggerInterface $logger,
        private ControleLimiteSpotifyService $controleLimite,
        private CacheItemPoolInterface $cache,
    ) {
    }

    /**
     * Telas abertas ao mesmo tempo (Música e Inglês & Pronúncia) dividem a mesma consulta por alguns segundos; o progresso é adiantado pelo tempo em cache.
     */
    public function executar(Usuario $usuario): TocandoAgoraSpotifyDTO
    {
        $item = $this->cache->getItem(self::PREFIXO_CACHE.$usuario->getId());
        $guardado = $item->isHit() ? $item->get() : null;
        if (is_array($guardado) && ($guardado['tocando'] ?? null) instanceof TocandoAgoraSpotifyDTO && is_int($guardado['em'] ?? null)) {
            return $guardado['tocando']->avancado($this->agoraMs() - $guardado['em']);
        }

        $tocando = $this->consultar($usuario);
        $item->set(['tocando' => $tocando, 'em' => $this->agoraMs()]);
        $item->expiresAfter(self::VALIDADE_CACHE_SEGUNDOS);
        $this->cache->save($item);

        return $tocando;
    }

    private function agoraMs(): int
    {
        return (int) floor(microtime(true) * self::MS_POR_SEGUNDO);
    }

    private function consultar(Usuario $usuario): TocandoAgoraSpotifyDTO
    {
        $conta = $this->contaSpotifyRepository->buscarDoUsuario($usuario);
        if (null === $conta || !$conta->isConectada()) {
            return TocandoAgoraSpotifyDTO::nada();
        }

        $bloqueio = $this->controleLimite->buscarBloqueioAtivo();
        if (null !== $bloqueio) {
            return TocandoAgoraSpotifyDTO::bloqueado($bloqueio->liberadoEm());
        }

        $this->controleLimite->registrarConsulta(OrigemConsultaSpotify::TocandoAgora);

        try {
            $tocando = $this->spotifyClient->obterTocandoAgora($this->obterTokenValidoService->executar($conta));
        } catch (SpotifyException $excecao) {
            $this->registrarBloqueioSeLimite($excecao);
            $this->logger->info('Não foi possível consultar o que está tocando no Spotify.', ['erro' => $excecao->getMessage()]);

            return TocandoAgoraSpotifyDTO::nada();
        }

        $artista = $tocando->artistaPrincipal();
        if (null === $tocando->nome || null === $artista) {
            return $tocando;
        }

        $resumo = $this->analiseRepository->buscarResumoAlvo($usuario, $artista, $tocando->nome);

        return $tocando->comHistorico(
            $resumo['streams'] ?? 0,
            PeriodoAnaliseSpotifyDTO::utcParaIsoLocal($resumo['primeira'] ?? null),
        );
    }

    private function registrarBloqueioSeLimite(SpotifyException $excecao): void
    {
        if (self::CODIGO_LIMITE_REQUISICOES !== $excecao->getCode()) {
            return;
        }

        $this->controleLimite->registrarBloqueio($excecao->segundosEspera(), OrigemConsultaSpotify::TocandoAgora, self::INTERVALO_CONSULTA_SEGUNDOS);
    }
}
