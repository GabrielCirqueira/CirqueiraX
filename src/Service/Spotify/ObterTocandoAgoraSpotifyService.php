<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\DataObject\Spotify\TocandoAgoraSpotifyDTO;
use App\Entity\Usuario;
use App\Exception\Spotify\SpotifyException;
use App\Interface\SpotifyInterface;
use App\Repository\AnaliseReproducaoSpotifyRepository;
use App\Repository\ContaSpotifyRepository;
use Psr\Log\LoggerInterface;

final readonly class ObterTocandoAgoraSpotifyService
{
    public function __construct(
        private ContaSpotifyRepository $contaSpotifyRepository,
        private ObterTokenValidoSpotifyService $obterTokenValidoService,
        private SpotifyInterface $spotifyClient,
        private AnaliseReproducaoSpotifyRepository $analiseRepository,
        private LoggerInterface $logger,
    ) {}

    public function executar(Usuario $usuario): TocandoAgoraSpotifyDTO
    {
        $conta = $this->contaSpotifyRepository->buscarDoUsuario($usuario);
        if (null === $conta || !$conta->isConectada()) {
            return TocandoAgoraSpotifyDTO::nada();
        }

        try {
            $tocando = $this->spotifyClient->obterTocandoAgora($this->obterTokenValidoService->executar($conta));
        } catch (SpotifyException $excecao) {
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
}
