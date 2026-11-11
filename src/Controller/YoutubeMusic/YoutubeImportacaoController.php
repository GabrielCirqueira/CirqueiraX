<?php

declare(strict_types=1);

namespace App\Controller\YoutubeMusic;

use App\Controller\Common\DefaultController;
use App\DataObject\YoutubeMusic\UploadImportacaoYoutubeDTO;
use App\Entity\Usuario;
use App\Serializer\ImportacaoYoutubeSerializer;
use App\Service\YoutubeMusic\Importacao\CancelarClassificacaoImportacaoYoutubeService;
use App\Service\YoutubeMusic\Importacao\ConfirmarImportacaoYoutubeService;
use App\Service\YoutubeMusic\Importacao\ConsultarImportacaoYoutubeService;
use App\Service\YoutubeMusic\Importacao\IniciarImportacaoYoutubeService;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/v1/youtube-music/importacoes', name: 'api_youtube_music_importacoes_')]
final class YoutubeImportacaoController extends DefaultController
{
    public function __construct(
        private readonly IniciarImportacaoYoutubeService $iniciarService,
        private readonly ConsultarImportacaoYoutubeService $consultarService,
        private readonly ConfirmarImportacaoYoutubeService $confirmarService,
        private readonly CancelarClassificacaoImportacaoYoutubeService $cancelarService,
        private readonly ImportacaoYoutubeSerializer $serializer,
    ) {
    }

    #[Route('', name: 'iniciar', methods: ['POST'])]
    public function iniciar(Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        $importacao = $this->iniciarService->executar(UploadImportacaoYoutubeDTO::fromRequest($request), $usuario);

        return $this->created($this->serializer->serializar($importacao));
    }

    #[Route('/{uuid}', name: 'consultar', methods: ['GET'])]
    public function consultar(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->serializer->serializar($this->consultarService->executar($uuid, $usuario)));
    }

    #[Route('/{uuid}/confirmar', name: 'confirmar', methods: ['POST'])]
    public function confirmar(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->serializer->serializar($this->confirmarService->executar($uuid, $usuario)));
    }

    #[Route('/{uuid}/cancelar', name: 'cancelar', methods: ['POST'])]
    public function cancelar(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->serializer->serializar($this->cancelarService->executar($uuid, $usuario)));
    }
}
