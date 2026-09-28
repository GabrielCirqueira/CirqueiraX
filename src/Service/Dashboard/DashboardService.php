<?php

declare(strict_types=1);

namespace App\Service\Dashboard;

use App\Enum\StatusMediaItem;
use App\Repository\MediaItemRepository;

final readonly class DashboardService
{
    public function __construct(
        private MediaItemRepository $mediaItemRepository,
    ) {}

    /**
     * @return array{
     *     totalGeral: int,
     *     totalErros: int,
     *     status: array<string, int>,
     *     origem: array<string, int>
     * }
     */
    public function obterResumo(): array
    {
        $totaisStatus = $this->mediaItemRepository->contarAgrupadoPorStatus();
        $totaisOrigem = $this->mediaItemRepository->contarAgrupadoPorOrigem();

        $totalGeral = array_sum($totaisStatus);
        $totalErros = $totaisStatus[StatusMediaItem::ERRO->value] ?? 0;

        return [
            'totalGeral' => $totalGeral,
            'totalErros' => $totalErros,
            'status' => $totaisStatus,
            'origem' => $totaisOrigem,
        ];
    }
}
