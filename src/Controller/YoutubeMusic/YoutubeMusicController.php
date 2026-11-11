<?php

declare(strict_types=1);

namespace App\Controller\YoutubeMusic;

use App\Controller\Common\DefaultController;
use App\DataObject\YoutubeMusic\ConectarYoutubeMusicDTO;
use App\Entity\Usuario;
use App\Serializer\ContaYoutubeMusicSerializer;
use App\Service\YoutubeMusic\ConectarYoutubeMusicService;
use App\Service\YoutubeMusic\DesconectarYoutubeMusicService;
use App\Service\YoutubeMusic\ObterStatusYoutubeMusicService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/v1/youtube-music', name: 'api_youtube_music_')]
final class YoutubeMusicController extends DefaultController
{
    public function __construct(
        private readonly ConectarYoutubeMusicService $conectarService,
        private readonly ObterStatusYoutubeMusicService $obterStatusService,
        private readonly DesconectarYoutubeMusicService $desconectarService,
        private readonly ContaYoutubeMusicSerializer $serializer,
    ) {
    }

    #[Route('/conectar', name: 'conectar', methods: ['POST'])]
    public function conectar(#[CurrentUser] Usuario $usuario, #[MapRequestPayload] ConectarYoutubeMusicDTO $dto): Response
    {
        $conta = $this->conectarService->executar($usuario, $dto);

        return $this->success($this->serializer->serializar($conta));
    }

    #[Route('/status', name: 'status', methods: ['GET'])]
    public function status(#[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->serializer->serializar(
            $this->obterStatusService->executar($usuario),
            $this->obterStatusService->contarReproducoesColetadas($usuario),
        ));
    }

    #[Route('/desconectar', name: 'desconectar', methods: ['POST'])]
    public function desconectar(#[CurrentUser] Usuario $usuario): Response
    {
        $this->desconectarService->executar($usuario);

        return $this->success(['desconectado' => true]);
    }
}
