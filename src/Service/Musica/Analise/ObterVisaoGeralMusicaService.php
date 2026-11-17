<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\DataObject\Spotify\Analise\AlbumAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\ArtistaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\MusicaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Repository\AnaliseReproducaoMusicalRepository;
use App\Service\Spotify\AplicarImagensAnaliseSpotifyService;
use App\Service\Spotify\CacheAnaliseSpotifyService;

final readonly class ObterVisaoGeralMusicaService
{
    private const int LIMITE_MUSICAS = 10;
    private const int LIMITE_ARTISTAS = 5;
    private const int LIMITE_ALBUNS = 3;
    private const int LIMITE_ARTISTAS_NOVOS = 8;
    private const int PERCENTUAL = 100;
    private const string GRANULARIDADE_DIA = 'dia';
    private const string GRANULARIDADE_MES = 'mes';

    public function __construct(
        private AnaliseReproducaoMusicalRepository $analiseRepository,
        private AplicarImagensAnaliseSpotifyService $aplicarImagensService,
        private CacheAnaliseSpotifyService $cacheAnalise,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function executar(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        return $this->cacheAnalise->lembrar(
            $usuario,
            'visao-geral|'.$periodo->chaveCache(),
            fn (): array => $this->calcular($usuario, $fonte, $periodo),
            $fonte,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function calcular(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        $totais = $this->analiseRepository->calcularTotais($usuario, $periodo, $fonte);
        $topMusicas = $this->analiseRepository->listarRankingMusicas($usuario, $periodo, $fonte, self::LIMITE_MUSICAS);
        $topArtistas = $this->analiseRepository->listarRankingArtistas($usuario, $periodo, $fonte, self::LIMITE_ARTISTAS);
        $topAlbuns = $this->analiseRepository->listarRankingAlbuns($usuario, $periodo, $fonte, self::LIMITE_ALBUNS);
        $artistasNovos = array_slice(
            array_column($this->analiseRepository->listarArtistasNovos($usuario, $periodo, $fonte), 'artista'),
            0,
            self::LIMITE_ARTISTAS_NOVOS,
        );
        $mapa = $this->aplicarImagensService->mapear($usuario, [...$topMusicas, ...$topAlbuns], [...$topArtistas, ...$artistasNovos]);

        return [
            'periodo' => $periodo->paraArray(),
            'totais' => [
                'minutos' => $totais['minutos'],
                'streams' => $totais['streams'],
                'artistas' => $totais['artistas'],
                'musicas' => $totais['musicas'],
                'dias' => $totais['dias'],
                'porFonte' => $totais['porFonte'],
                'minutosEstimados' => $totais['minutosEstimados'],
            ],
            'variacaoMinutosPercentual' => $this->calcularVariacao($usuario, $fonte, $periodo, $totais['minutos']),
            'serie' => $this->montarSerie($usuario, $fonte, $periodo),
            'porHora' => $this->somarPorHora($usuario, $fonte, $periodo),
            'topMusicas' => array_map(static fn (MusicaAnaliseSpotifyDTO $item): array => $item->paraArray(), $this->aplicarImagensService->aplicar($topMusicas, $mapa)),
            'topArtistas' => array_map(static fn (ArtistaAnaliseSpotifyDTO $item): array => $item->paraArray(), $this->aplicarImagensService->aplicar($topArtistas, $mapa)),
            'topAlbuns' => array_map(static fn (AlbumAnaliseSpotifyDTO $item): array => $item->paraArray(), $this->aplicarImagensService->aplicar($topAlbuns, $mapa)),
            'artistasNovos' => array_map(static fn (ArtistaAnaliseSpotifyDTO $item): array => $item->paraArray(), $this->aplicarImagensService->aplicar($artistasNovos, $mapa)),
        ];
    }

    private function calcularVariacao(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoAnaliseSpotifyDTO $periodo, int $minutos): ?int
    {
        $anterior = $periodo->periodoAnterior();
        if (null === $anterior) {
            return null;
        }

        $minutosAnteriores = $this->analiseRepository->calcularTotais($usuario, $anterior, $fonte)['minutos'];
        if ($minutosAnteriores <= 0) {
            return null;
        }

        return (int) round((($minutos - $minutosAnteriores) / $minutosAnteriores) * self::PERCENTUAL);
    }

    /**
     * @return array{granularidade: string, pontos: list<array<string, mixed>>}
     */
    private function montarSerie(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        if ($periodo->isSerieDiaria()) {
            return [
                'granularidade' => self::GRANULARIDADE_DIA,
                'pontos' => $this->analiseRepository->listarMinutosPorDiaDoPeriodo($usuario, $periodo, $fonte),
            ];
        }

        return [
            'granularidade' => self::GRANULARIDADE_MES,
            'pontos' => array_map(static fn (array $mes): array => [
                'data' => sprintf('%04d-%02d-01', $mes['ano'], $mes['mes']),
                'minutos' => $mes['minutos'],
                'streams' => $mes['streams'],
            ], $this->analiseRepository->calcularEvolucaoMensal($usuario, $periodo, $fonte)),
        ];
    }

    /**
     * @return list<array{hora: int, minutos: int}>
     */
    private function somarPorHora(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        $porHora = array_fill(0, 24, 0);
        foreach ($this->analiseRepository->calcularMapaHorarios($usuario, $periodo, $fonte) as $celula) {
            $porHora[$celula['hora']] += $celula['minutos'];
        }

        return array_map(static fn (int $hora, int $minutos): array => ['hora' => $hora, 'minutos' => $minutos], array_keys($porHora), $porHora);
    }
}
