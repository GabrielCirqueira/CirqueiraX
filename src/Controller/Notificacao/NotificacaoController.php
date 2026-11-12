<?php

declare(strict_types=1);

namespace App\Controller\Notificacao;

use App\Controller\Common\DefaultController;
use App\DataObject\MarcarNotificacoesLidasDTO;
use App\Entity\Usuario;
use App\Serializer\NotificacaoSerializer;
use App\Service\Notificacao\ListarNotificacoesService;
use App\Service\Notificacao\MarcarNotificacoesLidasService;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/v1/notificacoes', name: 'api_notificacoes_')]
final class NotificacaoController extends DefaultController
{
    public function __construct(
        private readonly ListarNotificacoesService $listarService,
        private readonly MarcarNotificacoesLidasService $marcarLidasService,
        private readonly NotificacaoSerializer $serializer,
    ) {}

    #[Route('', name: 'listar', methods: ['GET'])]
    public function listar(Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        $resultado = $this->listarService->executar(
            $usuario,
            $request->query->getInt('limite', ListarNotificacoesService::LIMITE_PADRAO),
            $request->query->getBoolean('naoLidas'),
        );

        return $this->success($this->serializer->serializarLista($resultado['itens'], $resultado['naoLidas']));
    }

    #[Route('/marcar-lidas', name: 'marcar_lidas', methods: ['POST'])]
    public function marcarLidas(#[CurrentUser] Usuario $usuario, #[MapRequestPayload] MarcarNotificacoesLidasDTO $dto = new MarcarNotificacoesLidasDTO()): Response
    {
        return $this->success(['marcadas' => $this->marcarLidasService->executar($usuario, $dto)]);
    }
}
