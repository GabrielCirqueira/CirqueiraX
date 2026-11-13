<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\DataObject\Spotify\Analise\ArtistaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\LinhaDoTempoMusicaDTO;
use App\DataObject\Spotify\Analise\MesLinhaDoTempoMusicaDTO;
use App\DataObject\Spotify\Analise\MusicaAnaliseSpotifyDTO;
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
        $musicasPorMes = $this->agruparPorMes($this->analiseRepository->listarRankingMusicasPorMes($usuario, $fonte, self::LIMITE_COMPARACAO, self::LIMITE_EXIBIDO));
        $artistasPorMes = $this->agruparPorMes($this->analiseRepository->listarRankingArtistasPorMes($usuario, $fonte, self::LIMITE_COMPARACAO, self::LIMITE_EXIBIDO));
        $posicoesMusicas = [];
        $posicoesArtistas = [];
        $meses = [];
        $todasMusicas = [];
        $todosArtistas = [];

        foreach (array_reverse($this->analiseRepository->listarMesesDisponiveis($usuario, $fonte)) as $mesInfo) {
            $chaveMes = $this->chaveMes($mesInfo->ano(), $mesInfo->mes());
            $rankingMusicas = $musicasPorMes[$chaveMes] ?? [];
            $rankingArtistas = $artistasPorMes[$chaveMes] ?? [];
            if ([] === $rankingMusicas && [] === $rankingArtistas) {
                continue;
            }

            /** @var list<MusicaAnaliseSpotifyDTO> $musicasExibidas */
            $musicasExibidas = $this->itensExibidos($rankingMusicas);
            /** @var list<ArtistaAnaliseSpotifyDTO> $artistasExibidos */
            $artistasExibidos = $this->itensExibidos($rankingArtistas);

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

            $posicoesMusicas = $this->mapearPosicoes($rankingMusicas);
            $posicoesArtistas = $this->mapearPosicoes($rankingArtistas);
            array_push($todasMusicas, ...$musicasExibidas);
            array_push($todosArtistas, ...$artistasExibidos);
        }

        $mapa = $this->aplicarImagensService->mapear($usuario, $todasMusicas, $todosArtistas);

        return new LinhaDoTempoMusicaDTO(array_map(static fn (MesLinhaDoTempoMusicaDTO $mes): MesLinhaDoTempoMusicaDTO => $mes->comImagens($mapa), $meses));
    }

    /**
     * @template T
     *
     * @param list<array{ano: int, mes: int, posicao: int, chave: string, item: T|null}> $linhas
     *
     * @return array<string, list<array{ano: int, mes: int, posicao: int, chave: string, item: T|null}>>
     */
    private function agruparPorMes(array $linhas): array
    {
        $porMes = [];
        foreach ($linhas as $linha) {
            $porMes[$this->chaveMes($linha['ano'], $linha['mes'])][] = $linha;
        }

        return $porMes;
    }

    private function chaveMes(int $ano, int $mes): string
    {
        return sprintf('%d-%02d', $ano, $mes);
    }

    /**
     * @template T of object
     *
     * @param list<array{ano: int, mes: int, posicao: int, chave: string, item: T|null}> $ranking
     *
     * @return list<T>
     */
    private function itensExibidos(array $ranking): array
    {
        return array_values(array_filter(array_map(static fn (array $linha): ?object => $linha['item'], $ranking)));
    }

    /**
     * @param list<array{ano: int, mes: int, posicao: int, chave: string, item: mixed}> $ranking
     *
     * @return array<string, int>
     */
    private function mapearPosicoes(array $ranking): array
    {
        $posicoes = [];
        foreach ($ranking as $linha) {
            $posicoes[$linha['chave']] ??= $linha['posicao'];
        }

        return $posicoes;
    }
}
