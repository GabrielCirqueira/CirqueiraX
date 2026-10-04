<?php

declare(strict_types=1);

namespace App\Controller\GoogleFotos;

use App\Controller\Common\DefaultController;
use App\Service\GoogleFotos\ObterStatusContaGoogleFotosService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/google-fotos', name: 'api_google_fotos_')]
final class GoogleFotosController extends DefaultController
{
    public function __construct(
        private readonly ObterStatusContaGoogleFotosService $obterStatusContaService,
    ) {}

    #[Route('/status', name: 'status', methods: ['GET'])]
    public function status(): Response
    {
        $statusDTO = $this->obterStatusContaService->obterStatus();

        return $this->success($statusDTO->paraArray());
    }
}
