<?php

declare(strict_types=1);

namespace App\Service\Dashboard;

use App\Entity\Usuario;
use App\Enum\OrigemMedia;
use App\Enum\StatusMediaItem;
use App\Repository\CategoriaRepository;
use App\Repository\ContaSpotifyRepository;
use App\Repository\MediaItemRepository;
use App\Serializer\MediaItemSerializer;

final readonly class DashboardService
{
    public const int LIMITE_ALERTA_COLETA_PARADA_SEGUNDOS = 10800;

    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private CategoriaRepository $categoriaRepository,
        private MediaItemSerializer $mediaItemSerializer,
        private ContaSpotifyRepository $contaSpotifyRepository,
    ) {}

    /**
     * @return array{
     *     totalGeral: int,
     *     totalErros: int,
     *     tamanhoTotalBytes: int,
     *     tamanhoTotalFormatado: string,
     *     status: array<string, int>,
     *     porStatus: array<string, int>,
     *     origem: array<string, int>,
     *     porOrigem: array<string, int>,
     *     origemEspaco: array<string, array{totalItens: int, tamanhoBytes: int, tamanhoFormatado: string}>,
     *     porOrigemEspaco: array<string, array{totalItens: int, tamanhoBytes: int, tamanhoFormatado: string}>,
     *     ultimasMidias: list<array<string, mixed>>,
     *     metricasVideos: array{
     *         totalBaixados: int,
     *         totalRemovidos: int,
     *         permanecemSistema: int,
     *         removidosHoje: int,
     *         tamanhoPermanecemBytes: int,
     *         tamanhoPermanecemFormatado: string,
     *         espacoLiberadoBytes: int,
     *         espacoLiberadoFormatado: string
     *     },
     *     spotify: array{
     *         conectado: bool,
     *         status: string,
     *         nomeExibicao: string|null,
     *         conectadoEm: string|null,
     *         ultimaColetaEm: string|null,
     *         coletaParada: bool,
     *         motivoErro: string|null
     *     }
     * }
     */
    public function obterResumo(?Usuario $usuario = null): array
    {
        $totaisStatus = $this->mediaItemRepository->contarAgrupadoPorStatus();
        $totaisOrigem = $this->mediaItemRepository->contarAgrupadoPorOrigem();
        $espacoOrigem = $this->mediaItemRepository->obterEspacoAgrupadoPorOrigem();
        $tamanhoTotalBytes = $this->mediaItemRepository->obterTamanhoTotalBytes();
        $metricasVideosRaw = $this->mediaItemRepository->obterMetricasVideos();

        $origemEspaco = [];
        foreach ($espacoOrigem as $origemVal => $dados) {
            $origemEspaco[$origemVal] = [
                'totalItens' => $dados['totalItens'],
                'tamanhoBytes' => $dados['tamanhoBytes'],
                'tamanhoFormatado' => self::formatarBytes($dados['tamanhoBytes']),
            ];
        }

        $totalGeral = array_sum($totaisStatus);
        $totalErros = $totaisStatus[StatusMediaItem::ERRO->value] ?? 0;

        $ultimosItens = $this->mediaItemRepository->findBy([], ['criadoEm' => 'DESC'], 6);

        $metricasVideos = [
            'totalBaixados' => $metricasVideosRaw['totalBaixados'],
            'totalRemovidos' => $metricasVideosRaw['totalRemovidos'],
            'permanecemSistema' => $metricasVideosRaw['permanecemSistema'],
            'removidosHoje' => $metricasVideosRaw['removidosHoje'],
            'tamanhoPermanecemBytes' => $metricasVideosRaw['tamanhoPermanecemBytes'],
            'tamanhoPermanecemFormatado' => self::formatarBytes($metricasVideosRaw['tamanhoPermanecemBytes']),
            'espacoLiberadoBytes' => $metricasVideosRaw['espacoLiberadoBytes'],
            'espacoLiberadoFormatado' => self::formatarBytes($metricasVideosRaw['espacoLiberadoBytes']),
        ];

        $contaSpotify = null !== $usuario ? $this->contaSpotifyRepository->buscarDoUsuario($usuario) : null;
        if (null === $contaSpotify && null === $usuario) {
            $contasConectadas = $this->contaSpotifyRepository->listarConectadas();
            $contaSpotify = $contasConectadas[0] ?? null;
        }

        $agora = new \DateTimeImmutable();
        $isColetaParada = false;
        if (null !== $contaSpotify && $contaSpotify->isConectada()) {
            $referencia = $contaSpotify->ultimaColetaEm() ?? $contaSpotify->conectadoEm();
            if (null !== $referencia) {
                $segundosSemColeta = $agora->getTimestamp() - $referencia->getTimestamp();
                $isColetaParada = $segundosSemColeta > self::LIMITE_ALERTA_COLETA_PARADA_SEGUNDOS;
            }
        }

        $resumoSpotify = [
            'conectado' => $contaSpotify?->isConectada() ?? false,
            'status' => $contaSpotify?->status()->value ?? 'desconectada',
            'nomeExibicao' => $contaSpotify?->nomeExibicao(),
            'conectadoEm' => $contaSpotify?->conectadoEm()?->format(\DateTimeInterface::ATOM),
            'ultimaColetaEm' => $contaSpotify?->ultimaColetaEm()?->format(\DateTimeInterface::ATOM),
            'coletaParada' => $isColetaParada,
            'motivoErro' => $contaSpotify?->erroMotivo(),
        ];

        return [
            'totalGeral' => $totalGeral,
            'totalErros' => $totalErros,
            'tamanhoTotalBytes' => $tamanhoTotalBytes,
            'tamanhoTotalFormatado' => self::formatarBytes($tamanhoTotalBytes),
            'status' => $totaisStatus,
            'porStatus' => $totaisStatus,
            'origem' => $totaisOrigem,
            'porOrigem' => $totaisOrigem,
            'origemEspaco' => $origemEspaco,
            'porOrigemEspaco' => $origemEspaco,
            'ultimasMidias' => $this->mediaItemSerializer->normalizarLista($ultimosItens),
            'metricasVideos' => $metricasVideos,
            'spotify' => $resumoSpotify,
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
        $metricasPorCat = $this->mediaItemRepository->obterMetricasAgrupadasPorCategoria();

        $resultado = [];
        foreach ($categorias as $cat) {
            $uuidStr = $cat->uuid()?->toString();
            $metricas = (null !== $uuidStr && isset($metricasPorCat[$uuidStr]))
                ? $metricasPorCat[$uuidStr]
                : ['totalItens' => 0, 'tamanhoBytes' => 0];

            $resultado[] = [
                'categoriaId' => $uuidStr,
                'nome' => $cat->nome(),
                'pastaLocal' => $cat->pastaLocal(),
                'totalItens' => $metricas['totalItens'],
                'tamanhoBytes' => $metricas['tamanhoBytes'],
                'tamanhoFormatado' => self::formatarBytes($metricas['tamanhoBytes']),
            ];
        }

        $semCatMetricas = $metricasPorCat[null] ?? ['totalItens' => 0, 'tamanhoBytes' => 0];
        $resultado[] = [
            'categoriaId' => null,
            'nome' => 'Sem Categoria',
            'pastaLocal' => null,
            'totalItens' => $semCatMetricas['totalItens'],
            'tamanhoBytes' => $semCatMetricas['tamanhoBytes'],
            'tamanhoFormatado' => self::formatarBytes($semCatMetricas['tamanhoBytes']),
        ];

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
