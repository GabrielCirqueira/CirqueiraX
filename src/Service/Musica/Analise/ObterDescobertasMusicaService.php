<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\DataObject\Spotify\Analise\DescobertasSpotifyDTO;
use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Service\Spotify\CacheAnaliseSpotifyService;
use App\Service\Spotify\AplicarImagensAnaliseSpotifyService;
use App\Repository\AnaliseReproducaoMusicalRepository;

final readonly class ObterDescobertasMusicaService
{
    private const int LIMITE_NOVIDADES = 24;
    private const int LIMITE_REDESCOBERTAS = 12;
    private const int LIMITE_OBSESSOES = 10;
    private const int DIAS_AUSENCIA_REDESCOBERTA = 90;
    private const int DIAS_JANELA_OBSESSAO = 7;
    private const int MINIMO_NA_JANELA_OBSESSAO = 8;

    public function __construct(
        private CacheAnaliseSpotifyService $cacheAnalise,
        private AnaliseReproducaoMusicalRepository $analiseRepository,
        private AplicarImagensAnaliseSpotifyService $aplicarImagensService,
    ) {}

    public function executar(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoAnaliseSpotifyDTO $periodo): DescobertasSpotifyDTO
    {
        return $this->cacheAnalise->lembrar($usuario, 'descobertas|' . $periodo->chaveCache(), fn (): DescobertasSpotifyDTO => $this->calcular($usuario, $fonte, $periodo), $fonte);
    }

    private function calcular(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoAnaliseSpotifyDTO $periodo): DescobertasSpotifyDTO
    {
        $artistasNovos = $this->analiseRepository->listarArtistasNovos($usuario, $periodo, $fonte);
        $musicasNovas = $this->analiseRepository->listarMusicasNovas($usuario, $periodo, $fonte);
        $artistasExibidos = array_slice($artistasNovos, 0, self::LIMITE_NOVIDADES);
        $musicasExibidas = array_slice($musicasNovas, 0, self::LIMITE_NOVIDADES);
        $redescobertas = $this->analiseRepository->listarRedescobertas(
            $usuario,
            $periodo,
            $fonte,
            self::DIAS_AUSENCIA_REDESCOBERTA,
            self::LIMITE_REDESCOBERTAS,
        );
        $obsessoes = $this->analiseRepository->listarObsessoes(
            $usuario,
            $periodo,
            $fonte,
            self::DIAS_JANELA_OBSESSAO,
            self::MINIMO_NA_JANELA_OBSESSAO,
            self::LIMITE_OBSESSOES,
        );

        $mapa = $this->aplicarImagensService->mapear(
            $usuario,
            [...array_column($musicasExibidas, 'musica'), ...array_column($obsessoes, 'musica')],
            [...array_column($artistasExibidos, 'artista'), ...array_column($redescobertas, 'artista')],
        );

        return new DescobertasSpotifyDTO(
            periodo: $periodo,
            totalArtistasNovos: count($artistasNovos),
            totalMusicasNovas: count($musicasNovas),
            artistasNovos: array_map(static fn (array $item): array => [
                'artista' => $item['artista']->comImagem($mapa),
                'primeira' => $item['primeira'],
            ], $artistasExibidos),
            musicasNovas: array_map(static fn (array $item): array => [
                'musica' => $item['musica']->comImagem($mapa),
                'primeira' => $item['primeira'],
            ], $musicasExibidas),
            redescobertas: array_map(static fn (array $item): array => [
                'artista' => $item['artista']->comImagem($mapa),
                'ultimaAntes' => $item['ultimaAntes'],
                'voltouEm' => $item['voltouEm'],
            ], $redescobertas),
            obsessoes: array_map(static fn (array $item): array => [
                'musica' => $item['musica']->comImagem($mapa),
                'vezesNaJanela' => $item['vezesNaJanela'],
                'fimJanela' => $item['fimJanela'],
                'total' => $item['total'],
            ], $obsessoes),
            diasJanelaObsessao: self::DIAS_JANELA_OBSESSAO,
        );
    }
}
