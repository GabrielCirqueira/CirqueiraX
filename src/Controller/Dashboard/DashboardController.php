<?php

declare(strict_types=1);

namespace App\Controller\Dashboard;

use App\Controller\Common\DefaultController;
use App\DataObject\PaginacaoDTO;
use App\Serializer\MediaItemSerializer;
use App\Service\Dashboard\DashboardService;
use App\Service\MediaItem\MediaItemService;
use App\Service\MediaItem\RetentarMediaItemService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/dashboard', name: 'api_dashboard_')]
final class DashboardController extends DefaultController
{
    public function __construct(
        private readonly DashboardService $dashboardService,
        private readonly MediaItemService $mediaItemService,
        private readonly RetentarMediaItemService $retentarMediaItemService,
        private readonly MediaItemSerializer $mediaItemSerializer,
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

    #[Route('/erros', name: 'erros', methods: ['GET'])]
    public function erros(#[MapQueryString] ?PaginacaoDTO $paginacao = null): Response
    {
        $paginacao ??= new PaginacaoDTO();
        $resultado = $this->mediaItemService->paginarComFiltros(
            ['status' => 'erro'],
            $paginacao->pagina(),
            $paginacao->limite(),
        );

        return $this->paginated(
            $this->mediaItemSerializer->normalizarLista($resultado['itens']),
            $resultado['total'],
            $paginacao->pagina(),
            $paginacao->limite(),
        );
    }

    #[Route('/erros/retentar', name: 'erros_retentar', methods: ['POST'])]
    public function retentarErros(): Response
    {
        $itens = $this->retentarMediaItemService->retentarTodosComErro();

        return $this->success($this->mediaItemSerializer->normalizarLista($itens));
    }
}
