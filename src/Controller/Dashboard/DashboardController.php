<?php

declare(strict_types=1);

namespace App\Controller\Dashboard;

use App\Controller\Common\DefaultController;
use App\Service\Dashboard\DashboardService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/dashboard', name: 'api_dashboard_')]
final class DashboardController extends DefaultController
{
    public function __construct(
        private readonly DashboardService $dashboardService,
    ) {}

    #[Route('/resumo', name: 'resumo', methods: ['GET'])]
    public function resumo(): Response
    {
        return $this->success($this->dashboardService->obterResumo());
    }

    #[Route('/categorias', name: 'categorias', methods: ['GET'])]
    public function categorias(): Response
    {
        return $this->success($this->dashboardService->resumoPorCategoria());
    }
}
