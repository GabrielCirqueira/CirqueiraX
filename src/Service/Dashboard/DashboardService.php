<?php

declare(strict_types=1);

namespace App\Service\Dashboard;

use App\Enum\OrigemMedia;
use App\Enum\StatusMediaItem;
use App\Repository\CategoriaRepository;
use App\Repository\MediaItemRepository;

final readonly class DashboardService
{
    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private CategoriaRepository $categoriaRepository,
    ) {}

    /**
     * @return array{
     *     totalGeral: int,
     *     totalErros: int,
     *     tamanhoTotalBytes: int,
     *     tamanhoTotalFormatado: string,
     *     status: array<string, int>,
     *     origem: array<string, int>,
     *     origemEspaco: array<string, array{totalItens: int, tamanhoBytes: int, tamanhoFormatado: string}>
     * }
     */
    public function obterResumo(): array
    {
        $totaisStatus = $this->mediaItemRepository->contarAgrupadoPorStatus();
        $totaisOrigem = $this->mediaItemRepository->contarAgrupadoPorOrigem();

        $itens = $this->mediaItemRepository->findAll();
        $tamanhoTotalBytes = 0;
        $origemEspaco = [];

        foreach (OrigemMedia::cases() as $case) {
            $origemEspaco[$case->value] = [
                'totalItens' => 0,
                'tamanhoBytes' => 0,
                'tamanhoFormatado' => '0 B',
            ];
        }

        foreach ($itens as $item) {
            $bytes = $item->tamanhoBytes();
            $tamanhoTotalBytes += $bytes;

            $origemVal = $item->origem()->value;
            if (!isset($origemEspaco[$origemVal])) {
                $origemEspaco[$origemVal] = [
                    'totalItens' => 0,
                    'tamanhoBytes' => 0,
                    'tamanhoFormatado' => '0 B',
                ];
            }
            $origemEspaco[$origemVal]['totalItens']++;
            $origemEspaco[$origemVal]['tamanhoBytes'] += $bytes;
        }

        foreach ($origemEspaco as $origemVal => $dados) {
            $origemEspaco[$origemVal]['tamanhoFormatado'] = self::formatarBytes($dados['tamanhoBytes']);
        }

        $totalGeral = array_sum($totaisStatus);
        $totalErros = $totaisStatus[StatusMediaItem::ERRO->value] ?? 0;

        return [
            'totalGeral' => $totalGeral,
            'totalErros' => $totalErros,
            'tamanhoTotalBytes' => $tamanhoTotalBytes,
            'tamanhoTotalFormatado' => self::formatarBytes($tamanhoTotalBytes),
            'status' => $totaisStatus,
            'origem' => $totaisOrigem,
            'origemEspaco' => $origemEspaco,
        ];
    }

    /**
     * @return list<array{
     *     categoriaId: string|null,
     *     nome: string,
     *     pastaLocal: string|null,
     *     totalItens: int,
     *     tamanhoBytes: int,
     *     tamanhoFormatado: string
     * }>
     */
    public function resumoPorCategoria(): array
    {
        $categorias = $this->categoriaRepository->listarTodas();
        $itens = $this->mediaItemRepository->findAll();

        $mapaCategorias = [];
        foreach ($categorias as $cat) {
            $uuidStr = $cat->uuid()?->toString();
            if (null !== $uuidStr) {
                $mapaCategorias[$uuidStr] = [
                    'categoriaId' => $uuidStr,
                    'nome' => $cat->nome(),
                    'pastaLocal' => $cat->pastaLocal(),
                    'totalItens' => 0,
                    'tamanhoBytes' => 0,
                    'tamanhoFormatado' => '0 B',
                ];
            }
        }

        $semCategoriaData = [
            'categoriaId' => null,
            'nome' => 'Sem Categoria',
            'pastaLocal' => null,
            'totalItens' => 0,
            'tamanhoBytes' => 0,
            'tamanhoFormatado' => '0 B',
        ];

        foreach ($itens as $item) {
            $bytes = $item->tamanhoBytes();
            $catId = $item->categoriaId();

            if (null !== $catId && isset($mapaCategorias[$catId])) {
                $mapaCategorias[$catId]['totalItens']++;
                $mapaCategorias[$catId]['tamanhoBytes'] += $bytes;
            } else {
                $semCategoriaData['totalItens']++;
                $semCategoriaData['tamanhoBytes'] += $bytes;
            }
        }

        $resultado = [];
        foreach ($mapaCategorias as $catData) {
            $catData['tamanhoFormatado'] = self::formatarBytes($catData['tamanhoBytes']);
            $resultado[] = $catData;
        }

        $semCategoriaData['tamanhoFormatado'] = self::formatarBytes($semCategoriaData['tamanhoBytes']);
        $resultado[] = $semCategoriaData;

        return $resultado;
    }

    public static function formatarBytes(int $bytes): string
    {
        if ($bytes <= 0) {
            return '0 B';
        }

        $unidades = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = (int) floor(log($bytes, 1024));
        $i = min($i, count($unidades) - 1);
        $val = $bytes / (1024 ** $i);

        return sprintf('%.2f %s', $val, $unidades[$i]);
    }
}
