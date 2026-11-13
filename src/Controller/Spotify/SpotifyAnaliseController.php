<?php

declare(strict_types=1);

namespace App\Controller\Spotify;

use App\Controller\Common\DefaultController;
use App\DataObject\Spotify\TocarFaixaSpotifyDTO;
use App\Entity\Usuario;
use App\Service\Spotify\ObterTocandoAgoraSpotifyService;
use App\Service\Spotify\TocarFaixaSpotifyService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/v1/spotify', name: 'api_spotify_analise_')]
final class SpotifyAnaliseController extends DefaultController
{
    public function __construct(
        private readonly ObterTocandoAgoraSpotifyService $obterTocandoAgoraService,
        private readonly TocarFaixaSpotifyService $tocarFaixaService,
    ) {}

    #[Route('/tocando-agora', name: 'tocando_agora', methods: ['GET'])]
    public function tocandoAgora(#[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->obterTocandoAgoraService->executar($usuario)->paraArray());
    }

    #[Route('/tocar', name: 'tocar', methods: ['POST'])]
    public function tocar(
        #[CurrentUser] Usuario $usuario,
        #[MapRequestPayload] TocarFaixaSpotifyDTO $dto,
    ): Response {
        $aparelho = $this->tocarFaixaService->executar($usuario, $dto->codigoFaixa);

        return $this->success(['aparelho' => $aparelho->nome, 'tipo' => $aparelho->tipo]);
    }
}
