<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\DataObject\Spotify\Analise\ComportamentoReproducaoSpotifyDTO;
use App\DataObject\Spotify\Analise\HabitosSpotifyDTO;
use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Service\Spotify\CacheAnaliseSpotifyService;
use App\Service\Spotify\AplicarImagensAnaliseSpotifyService;
use App\Repository\AnaliseReproducaoMusicalRepository;

final readonly class ObterHabitosMusicaService
{
    private const int QUANTIDADE_TOPO = 5;

    public function __construct(
        private CacheAnaliseSpotifyService $cacheAnalise,
        private AnaliseReproducaoMusicalRepository $analiseRepository,
        private AplicarImagensAnaliseSpotifyService $aplicarImagensService,
    ) {}

    public function executar(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoAnaliseSpotifyDTO $periodo): HabitosSpotifyDTO
    {
        return $this->cacheAnalise->lembrar($usuario, 'habitos|' . $periodo->chaveCache(), fn (): HabitosSpotifyDTO => $this->calcular($usuario, $fonte, $periodo), $fonte);
    }

    private function calcular(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoAnaliseSpotifyDTO $periodo): HabitosSpotifyDTO
    {
        $totais = $this->analiseRepository->calcularTotais($usuario, $periodo, $fonte);
        $faixas = $this->analiseRepository->contarFaixasPorRepeticao($usuario, $periodo, $fonte);
        $topArtistas = $this->analiseRepository->listarRankingArtistas($usuario, $periodo, $fonte, self::QUANTIDADE_TOPO);
        $mapa = $this->aplicarImagensService->mapear($usuario, [], $topArtistas);

        return new HabitosSpotifyDTO(
            periodo: $periodo,
            totalMinutos: $totais['minutos'],
            totalStreams: $totais['streams'],
            artistasDistintos: $totais['artistas'],
            minutosTopArtistas: $this->analiseRepository->calcularMinutosTopArtistas($usuario, $periodo, $fonte, self::QUANTIDADE_TOPO),
            topArtistas: $this->aplicarImagensService->aplicar($topArtistas, $mapa),
            faixasComStream: $faixas['faixasComStream'],
            faixasUmaVez: $faixas['faixasUmaVez'],
            comportamento: ComportamentoReproducaoSpotifyDTO::deArray(
                $this->analiseRepository->calcularComportamento($usuario, $periodo, $fonte),
            ),
        );
    }
}
