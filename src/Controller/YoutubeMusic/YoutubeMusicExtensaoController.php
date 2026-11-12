<?php

declare(strict_types=1);

namespace App\Controller\YoutubeMusic;

use App\Controller\Common\DefaultController;
use App\DataObject\YoutubeMusic\GerarTokenExtensaoYoutubeDTO;
use App\DataObject\YoutubeMusic\LoteEventosExtensaoYoutubeDTO;
use App\Entity\Usuario;
use App\Security\ExtensaoYoutubeMusicUser;
use App\Serializer\TokenExtensaoYoutubeMusicSerializer;
use App\Service\YoutubeMusic\Extensao\GerarTokenExtensaoYoutubeService;
use App\Service\YoutubeMusic\Extensao\ListarTokensExtensaoYoutubeService;
use App\Service\YoutubeMusic\Extensao\RegistrarEventosExtensaoYoutubeService;
use App\Service\YoutubeMusic\Extensao\RevogarTokenExtensaoYoutubeService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/v1/youtube-music/extensao', name: 'api_youtube_music_extensao_')]
final class YoutubeMusicExtensaoController extends DefaultController
{
    public function __construct(
        private readonly RegistrarEventosExtensaoYoutubeService $registrarEventosService,
        private readonly GerarTokenExtensaoYoutubeService $gerarTokenService,
        private readonly ListarTokensExtensaoYoutubeService $listarTokensService,
        private readonly RevogarTokenExtensaoYoutubeService $revogarTokenService,
        private readonly TokenExtensaoYoutubeMusicSerializer $serializer,
    ) {
    }

    #[Route('/eventos', name: 'eventos', methods: ['POST'])]
    public function registrarEventos(#[CurrentUser] ExtensaoYoutubeMusicUser $extensao, #[MapRequestPayload] LoteEventosExtensaoYoutubeDTO $lote): Response
    {
        return $this->success([
            'recebidos' => $this->registrarEventosService->executar($extensao->token(), $lote),
            'aparelho' => $extensao->token()->nomeAparelho(),
        ]);
    }

    #[Route('/tokens', name: 'listar_tokens', methods: ['GET'])]
    public function listarTokens(#[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->serializer->serializarLista($this->listarTokensService->executar($usuario)));
    }

    #[Route('/tokens', name: 'gerar_token', methods: ['POST'])]
    public function gerarToken(#[CurrentUser] Usuario $usuario, #[MapRequestPayload] GerarTokenExtensaoYoutubeDTO $dto): Response
    {
        $gerado = $this->gerarTokenService->executar($usuario, $dto);

        return $this->created([
            ...$this->serializer->serializar($gerado->token),
            'token' => $gerado->textoToken,
        ]);
    }

    #[Route('/tokens/{uuid}', name: 'revogar_token', methods: ['DELETE'])]
    public function revogarToken(#[CurrentUser] Usuario $usuario, string $uuid): Response
    {
        $this->revogarTokenService->executar($usuario, $uuid);

        return $this->success(['revogado' => true]);
    }
}
