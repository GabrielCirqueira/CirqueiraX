<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\Analise\ComportamentoReproducaoSpotifyDTO;
use App\DataObject\Spotify\Analise\HabitosSpotifyDTO;
use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\Entity\Usuario;
use App\Repository\AnaliseReproducaoSpotifyRepository;

final readonly class ObterHabitosSpotifyService
{
    private const int QUANTIDADE_TOPO = 5;

    public function __construct(
        private CacheAnaliseSpotifyService $cacheAnalise,
        private AnaliseReproducaoSpotifyRepository $analiseRepository,
        private AplicarImagensAnaliseSpotifyService $aplicarImagensService,
    ) {}

    public function executar(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo): HabitosSpotifyDTO
    {
        return $this->cacheAnalise->lembrar($usuario, 'habitos|' . $periodo->chaveCache(), fn (): HabitosSpotifyDTO => $this->calcular($usuario, $periodo));
    }

    private function calcular(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo): HabitosSpotifyDTO
    {
        $totais = $this->analiseRepository->calcularTotais($usuario, $periodo);
        $faixas = $this->analiseRepository->contarFaixasPorRepeticao($usuario, $periodo);
        $topArtistas = $this->analiseRepository->listarRankingArtistas($usuario, $periodo, self::QUANTIDADE_TOPO, true);
        $mapa = $this->aplicarImagensService->mapear($usuario, [], $topArtistas);

        return new HabitosSpotifyDTO(
            periodo: $periodo,
            totalMinutos: $totais['minutos'],
            totalStreams: $totais['streams'],
            artistasDistintos: $totais['artistas'],
            mapaHorarios: $this->analiseRepository->calcularMapaHorarios($usuario, $periodo),
            minutosTopArtistas: $this->analiseRepository->calcularMinutosTopArtistas($usuario, $periodo, self::QUANTIDADE_TOPO),
            topArtistas: $this->aplicarImagensService->aplicar($topArtistas, $mapa),
            faixasComStream: $faixas['faixasComStream'],
            faixasUmaVez: $faixas['faixasUmaVez'],
            comportamento: ComportamentoReproducaoSpotifyDTO::deArray(
                $this->analiseRepository->calcularComportamento($usuario, $periodo),
            ),
        );
    }
}
