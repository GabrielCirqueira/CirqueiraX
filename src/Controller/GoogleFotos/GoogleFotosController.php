<?php

declare(strict_types=1);

namespace App\Controller\GoogleFotos;

use App\Controller\Common\DefaultController;
use App\Entity\Usuario;
use App\Service\GoogleFotos\AutorizarContaGoogleFotosService;
use App\Service\GoogleFotos\ListarAlbunsGoogleFotosService;
use App\Service\GoogleFotos\ObterStatusContaGoogleFotosService;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/v1/google-fotos', name: 'api_google_fotos_')]
final class GoogleFotosController extends DefaultController
{
    public function __construct(
        private readonly ObterStatusContaGoogleFotosService $obterStatusContaService,
        private readonly ListarAlbunsGoogleFotosService $listarAlbunsService,
        private readonly AutorizarContaGoogleFotosService $autorizarContaService,
    ) {}

    #[Route('/status', name: 'status', methods: ['GET'])]
    public function status(#[CurrentUser] Usuario $usuario): Response
    {
        $statusDTO = $this->obterStatusContaService->obterStatus($usuario);

        return $this->success($statusDTO->paraArray());
    }

    #[Route('/oauth/url', name: 'oauth_url', methods: ['GET'])]
    public function obterUrlAutorizacao(): Response
    {
        return $this->success([
            'url' => $this->autorizarContaService->obterUrlAutorizacao(),
        ]);
    }

    #[Route('/oauth/concluir', name: 'oauth_concluir', methods: ['POST'])]
    public function concluirAutorizacao(Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        /** @var array<string, mixed> $payload */
        $payload = json_decode($request->getContent(), true) ?? [];
        $entrada = (string) ($payload['codigoOuUrl'] ?? $payload['codigo'] ?? '');

        if ('' === trim($entrada)) {
            return $this->error('Código ou URL de redirecionamento não fornecido.');
        }

        try {
            $conta = $this->autorizarContaService->concluirAutorizacao($usuario, $entrada);

            return $this->success([
                'email' => $conta->email(),
                'conectado' => true,
            ]);
        } catch (\Throwable $e) {
            return $this->error('Falha ao autorizar Google Fotos: ' . $e->getMessage());
        }
    }

    #[Route('/desconectar', name: 'desconectar', methods: ['POST'])]
    public function desconectar(#[CurrentUser] Usuario $usuario): Response
    {
        $this->autorizarContaService->desconectar($usuario);

        return $this->success(['desconectado' => true]);
    }

    #[Route('/albuns', name: 'albuns', methods: ['GET'])]
    public function albuns(#[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->listarAlbunsService->listar($usuario));
    }
}
