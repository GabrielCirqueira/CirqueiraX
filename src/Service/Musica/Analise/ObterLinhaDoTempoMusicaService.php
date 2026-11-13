<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\DataObject\Spotify\Analise\ArtistaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\LinhaDoTempoMusicaDTO;
use App\DataObject\Spotify\Analise\MesLinhaDoTempoMusicaDTO;
use App\DataObject\Spotify\Analise\MusicaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\DataObject\Spotify\PeriodoMesSpotifyDTO;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Repository\AnaliseReproducaoMusicalRepository;
use App\Service\Spotify\AplicarImagensAnaliseSpotifyService;
use App\Service\Spotify\CacheAnaliseSpotifyService;

final readonly class ObterLinhaDoTempoMusicaService
{
    private const int LIMITE_EXIBIDO = 10;
    private const int LIMITE_COMPARACAO = 50;
    private const string CHAVE_CACHE = 'linha-do-tempo';

    public function __construct(
        private CacheAnaliseSpotifyService $cacheAnalise,
        private AnaliseReproducaoMusicalRepository $analiseRepository,
        private AplicarImagensAnaliseSpotifyService $aplicarImagensService,
    ) {}

    public function executar(Usuario $usuario, FiltroFonteMusica $fonte): LinhaDoTempoMusicaDTO
    {
        return $this->cacheAnalise->lembrar($usuario, self::CHAVE_CACHE, fn (): LinhaDoTempoMusicaDTO => $this->calcular($usuario, $fonte), $fonte);
    }

    private function calcular(Usuario $usuario, FiltroFonteMusica $fonte): LinhaDoTempoMusicaDTO
    {
        $mesesDisponiveis = array_reverse($this->analiseRepository->listarMesesDisponiveis($usuario, $fonte));
        $posicoesMusicas = [];
        $posicoesArtistas = [];
        $meses = [];
        $todasMusicas = [];
        $todosArtistas = [];

        foreach ($mesesDisponiveis as $mesInfo) {
            $periodo = PeriodoAnaliseSpotifyDTO::doMes($mesInfo->ano(), $mesInfo->mes());
            $musicas = $this->analiseRepository->listarRankingMusicas($usuario, $periodo, $fonte, self::LIMITE_COMPARACAO);
            $artistas = $this->analiseRepository->listarRankingArtistas($usuario, $periodo, $fonte, self::LIMITE_COMPARACAO);
            if ([] === $musicas && [] === $artistas) {
                continue;
            }

            $musicasExibidas = array_slice($musicas, 0, self::LIMITE_EXIBIDO);
            $artistasExibidos = array_slice($artistas, 0, self::LIMITE_EXIBIDO);

            $meses[] = new MesLinhaDoTempoMusicaDTO(
                ano: $mesInfo->ano(),
                mes: $mesInfo->mes(),
                totalMinutos: $mesInfo->totalMinutos(),
                totalReproducoes: $mesInfo->totalReproducoes(),
                emAndamento: PeriodoMesSpotifyDTO::criar($mesInfo->ano(), $mesInfo->mes())->isMesCorrente(),
                musicas: $musicasExibidas,
                posicoesAnterioresMusicas: array_map(static fn (MusicaAnaliseSpotifyDTO $musica): ?int => $posicoesMusicas[$musica->chaveIdentificacao()] ?? null, $musicasExibidas),
                artistas: $artistasExibidos,
                posicoesAnterioresArtistas: array_map(static fn (ArtistaAnaliseSpotifyDTO $artista): ?int => $posicoesArtistas[$artista->chaveIdentificacao()] ?? null, $artistasExibidos),
            );

            $posicoesMusicas = $this->mapearPosicoes(array_map(static fn (MusicaAnaliseSpotifyDTO $musica): string => $musica->chaveIdentificacao(), $musicas));
            $posicoesArtistas = $this->mapearPosicoes(array_map(static fn (ArtistaAnaliseSpotifyDTO $artista): string => $artista->chaveIdentificacao(), $artistas));
            array_push($todasMusicas, ...$musicasExibidas);
            array_push($todosArtistas, ...$artistasExibidos);
        }

        $mapa = $this->aplicarImagensService->mapear($usuario, $todasMusicas, $todosArtistas);

        return new LinhaDoTempoMusicaDTO(array_map(static fn (MesLinhaDoTempoMusicaDTO $mes): MesLinhaDoTempoMusicaDTO => $mes->comImagens($mapa), $meses));
    }

    /**
     * @param list<string> $chaves
     *
     * @return array<string, int>
     */
    private function mapearPosicoes(array $chaves): array
    {
        $posicoes = [];
        foreach ($chaves as $indice => $chave) {
            $posicoes[$chave] ??= $indice + 1;
        }

        return $posicoes;
    }
}
