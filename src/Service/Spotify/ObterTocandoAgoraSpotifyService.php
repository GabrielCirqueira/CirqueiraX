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
use Psr\Log\LoggerInterface;

final readonly class ObterTocandoAgoraSpotifyService
{
    private const int CODIGO_LIMITE_REQUISICOES = 429;
    private const int INTERVALO_CONSULTA_SEGUNDOS = 0;

    public function __construct(
        private ContaSpotifyRepository $contaSpotifyRepository,
        private ObterTokenValidoSpotifyService $obterTokenValidoService,
        private SpotifyInterface $spotifyClient,
        private AnaliseReproducaoSpotifyRepository $analiseRepository,
        private LoggerInterface $logger,
        private ControleLimiteSpotifyService $controleLimite,
    ) {
    }

    public function executar(Usuario $usuario): TocandoAgoraSpotifyDTO
    {
        $conta = $this->contaSpotifyRepository->buscarDoUsuario($usuario);
        if (null === $conta || !$conta->isConectada() || $this->controleLimite->estaBloqueado()) {
            return TocandoAgoraSpotifyDTO::nada();
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
