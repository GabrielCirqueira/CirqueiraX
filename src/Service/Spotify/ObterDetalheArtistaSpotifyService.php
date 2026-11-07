<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\Analise\ArtistaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\ComportamentoReproducaoSpotifyDTO;
use App\DataObject\Spotify\Analise\DetalheArtistaSpotifyDTO;
use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\RepeticaoDiariaSpotifyDTO;
use App\Entity\Usuario;
use App\Exception\Spotify\SpotifyException;
use App\Repository\AnaliseReproducaoSpotifyRepository;

final readonly class ObterDetalheArtistaSpotifyService
{
    private const int LIMITE_MUSICAS = 20;
    private const int LIMITE_ALBUNS = 8;
    private const int TAMANHO_TOPO = 5;

    public function __construct(
        private CacheAnaliseSpotifyService $cacheAnalise,
        private AnaliseReproducaoSpotifyRepository $analiseRepository,
        private AplicarImagensAnaliseSpotifyService $aplicarImagensService,
    ) {}

    public function executar(Usuario $usuario, string $nomeArtista): DetalheArtistaSpotifyDTO
    {
        return $this->cacheAnalise->lembrar($usuario, 'artista|' . mb_strtolower($nomeArtista), fn (): DetalheArtistaSpotifyDTO => $this->calcular($usuario, $nomeArtista));
    }

    private function calcular(Usuario $usuario, string $nomeArtista): DetalheArtistaSpotifyDTO
    {
        $resumo = $this->analiseRepository->buscarResumoAlvo($usuario, $nomeArtista, null);
        if (null === $resumo) {
            throw SpotifyException::artistaSemReproducoes($nomeArtista);
        }

        $todos = PeriodoAnaliseSpotifyDTO::todos();
        $artista = new ArtistaAnaliseSpotifyDTO(
            $resumo['artista'],
            $resumo['codigo_artista'],
            $resumo['streams'],
            (int) round($resumo['ms'] / 60000),
        );
        $musicas = $this->analiseRepository->listarRankingMusicas($usuario, $todos, self::LIMITE_MUSICAS, $nomeArtista);
        $albuns = $this->analiseRepository->listarRankingAlbuns($usuario, $todos, self::LIMITE_ALBUNS, $nomeArtista);
        $totalMinutos = $this->analiseRepository->calcularTotais($usuario, $todos)['minutos'];
        $mapa = $this->aplicarImagensService->mapear($usuario, [...$musicas, ...$albuns], [$artista]);

        return new DetalheArtistaSpotifyDTO(
            artista: $artista->comImagem($mapa),
            reproducoes: $resumo['reproducoes'],
            faixasDistintas: $resumo['faixas'],
            albunsDistintos: $resumo['albuns'],
            diasOuvidos: $resumo['dias'],
            primeiraVezEm: PeriodoAnaliseSpotifyDTO::utcParaIsoLocal($resumo['primeira']),
            ultimaVezEm: PeriodoAnaliseSpotifyDTO::utcParaIsoLocal($resumo['ultima']),
            posicaoGeral: $this->analiseRepository->buscarPosicaoGeral($usuario, $nomeArtista, null),
            percentualDoTempoTotal: $totalMinutos > 0 ? round(($artista->minutos / $totalMinutos) * 100, 1) : 0.0,
            evolucao: $this->analiseRepository->calcularEvolucaoMensal($usuario, $todos, $nomeArtista),
            mesesNoTopo: $this->analiseRepository->listarMesesNoTopo($usuario, $nomeArtista, null, self::TAMANHO_TOPO),
            topMusicas: $this->aplicarImagensService->aplicar($musicas, $mapa),
            topAlbuns: $this->aplicarImagensService->aplicar($albuns, $mapa),
            maiorRepeticaoDiaria: RepeticaoDiariaSpotifyDTO::deArray(
                $this->analiseRepository->buscarMaiorRepeticaoDiaria($usuario, $todos, $nomeArtista),
            ),
            comportamento: ComportamentoReproducaoSpotifyDTO::deArray(
                $this->analiseRepository->calcularComportamento($usuario, $todos, $nomeArtista),
            ),
        );
    }
}
