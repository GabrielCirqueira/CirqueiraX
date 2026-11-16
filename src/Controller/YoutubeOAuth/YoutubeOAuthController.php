<?php

declare(strict_types=1);

namespace App\Controller\YoutubeOAuth;

use App\Controller\Common\DefaultController;
use App\DataObject\TransferenciaPlaylist\ConcluirAutorizacaoYoutubeOAuthDTO;
use App\Entity\Usuario;
use App\Serializer\ContaYoutubeOAuthSerializer;
use App\Service\YoutubeOAuth\AutorizarContaYoutubeOAuthService;
use App\Service\YoutubeOAuth\DesconectarYoutubeOAuthService;
use App\Service\YoutubeOAuth\ObterStatusYoutubeOAuthService;
use DomainException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/v1/youtube-oauth', name: 'api_youtube_oauth_')]
final class YoutubeOAuthController extends DefaultController
{
    public function __construct(
        private readonly AutorizarContaYoutubeOAuthService $autorizarConta,
        private readonly ContaYoutubeOAuthSerializer $serializer,
        private readonly DesconectarYoutubeOAuthService $desconectar,
        private readonly ObterStatusYoutubeOAuthService $obterStatus,
    ) {
    }

    #[Route('/oauth/url', name: 'oauth_url', methods: ['GET'])]
    public function obterUrlAutorizacao(): Response
    {
        try {
            return $this->success([
                'url' => $this->autorizarConta->obterUrlAutorizacao(),
            ]);
        } catch (DomainException $e) {
            return $this->error($e->getMessage(), $e->getCode() > 0 ? $e->getCode() : Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('/oauth/concluir', name: 'oauth_concluir', methods: ['POST'])]
    public function concluirAutorizacao(
        #[MapRequestPayload] ConcluirAutorizacaoYoutubeOAuthDTO $dto,
        #[CurrentUser] Usuario $usuario,
    ): Response {
        try {
            $conta = $this->autorizarConta->concluirAutorizacao($usuario, $dto->code);

            return $this->success($this->serializer->serializar($conta));
        } catch (DomainException $e) {
            return $this->error($e->getMessage(), $e->getCode() > 0 ? $e->getCode() : Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('/status', name: 'status', methods: ['GET'])]
    public function status(#[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->serializer->serializar($this->obterStatus->executar($usuario)));
    }

    #[Route('/desconectar', name: 'desconectar', methods: ['POST'])]
    public function desconectar(#[CurrentUser] Usuario $usuario): Response
    {
        $this->desconectar->executar($usuario);

        return $this->success(['desconectado' => true]);
    }
}
