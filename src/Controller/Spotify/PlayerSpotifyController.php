<?php

declare(strict_types=1);

namespace App\Controller\Spotify;

use App\Controller\Common\DefaultController;
use App\Entity\Usuario;
use App\Service\Spotify\PlayerTesteSpotifyService;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/v1/spotify/player', name: 'api_spotify_player_')]
final class PlayerSpotifyController extends DefaultController
{
    public function __construct(
        private readonly PlayerTesteSpotifyService $playerTesteService,
    ) {
    }

    #[Route('/token', name: 'token', methods: ['GET'])]
    public function token(#[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->playerTesteService->obterToken($usuario));
    }

    #[Route('/tocar-teste', name: 'tocar_teste', methods: ['POST'])]
    public function tocarTeste(Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        $codigoDispositivo = trim((string) ($request->toArray()['deviceId'] ?? ''));

        return $this->success($this->playerTesteService->tocarMusicaTeste($usuario, $codigoDispositivo));
    }
}
