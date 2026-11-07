<?php

declare(strict_types=1);

namespace App\Controller\Spotify;

use App\Controller\Common\DefaultController;
use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\Entity\Usuario;
use App\Service\Spotify\ObterDescobertasSpotifyService;
use App\Service\Spotify\ObterDetalheArtistaSpotifyService;
use App\Service\Spotify\ObterDetalheMusicaSpotifyService;
use App\Service\Spotify\ObterEvolucaoMensalSpotifyService;
use App\Service\Spotify\ObterHabitosSpotifyService;
use App\Service\Spotify\ObterRecordesSpotifyService;
use App\Service\Spotify\ObterRetrospectivaAnualSpotifyService;
use App\Service\Spotify\ObterTocandoAgoraSpotifyService;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/v1/spotify', name: 'api_spotify_analise_')]
final class SpotifyAnaliseController extends DefaultController
{
    public function __construct(
        private readonly ObterDetalheArtistaSpotifyService $obterDetalheArtistaService,
        private readonly ObterDetalheMusicaSpotifyService $obterDetalheMusicaService,
        private readonly ObterHabitosSpotifyService $obterHabitosService,
        private readonly ObterRecordesSpotifyService $obterRecordesService,
        private readonly ObterEvolucaoMensalSpotifyService $obterEvolucaoMensalService,
        private readonly ObterDescobertasSpotifyService $obterDescobertasService,
        private readonly ObterRetrospectivaAnualSpotifyService $obterRetrospectivaService,
        private readonly ObterTocandoAgoraSpotifyService $obterTocandoAgoraService,
    ) {}

    #[Route('/artistas/detalhe', name: 'detalhe_artista', methods: ['GET'])]
    public function detalheArtista(Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        $artista = trim((string) $request->query->get('artista', ''));
        if ('' === $artista) {
            return $this->error('Informe o artista.');
        }

        return $this->success($this->obterDetalheArtistaService->executar($usuario, $artista)->paraArray());
    }

    #[Route('/musicas/detalhe', name: 'detalhe_musica', methods: ['GET'])]
    public function detalheMusica(Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        $nome = trim((string) $request->query->get('nome', ''));
        $artista = trim((string) $request->query->get('artista', ''));
        if ('' === $nome || '' === $artista) {
            return $this->error('Informe a música e o artista.');
        }

        return $this->success($this->obterDetalheMusicaService->executar($usuario, $nome, $artista)->paraArray());
    }

    #[Route('/habitos', name: 'habitos', methods: ['GET'])]
    public function habitos(Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        $periodo = PeriodoAnaliseSpotifyDTO::fromRequest($request);

        return $this->success($this->obterHabitosService->executar($usuario, $periodo)->paraArray());
    }

    #[Route('/recordes', name: 'recordes', methods: ['GET'])]
    public function recordes(#[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->obterRecordesService->executar($usuario)->paraArray());
    }

    #[Route('/evolucao', name: 'evolucao', methods: ['GET'])]
    public function evolucao(Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        $meses = $request->query->has('meses') ? $request->query->getInt('meses') : null;

        return $this->success($this->obterEvolucaoMensalService->executar($usuario, $meses)->paraArray());
    }

    #[Route('/descobertas', name: 'descobertas', methods: ['GET'])]
    public function descobertas(Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        $periodo = PeriodoAnaliseSpotifyDTO::fromRequest($request);

        return $this->success($this->obterDescobertasService->executar($usuario, $periodo)->paraArray());
    }

    #[Route('/retrospectiva/{ano<\d{4}>}', name: 'retrospectiva', methods: ['GET'])]
    public function retrospectiva(int $ano, #[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->obterRetrospectivaService->executar($usuario, $ano)->paraArray());
    }

    #[Route('/tocando-agora', name: 'tocando_agora', methods: ['GET'])]
    public function tocandoAgora(#[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->obterTocandoAgoraService->executar($usuario)->paraArray());
    }
}
