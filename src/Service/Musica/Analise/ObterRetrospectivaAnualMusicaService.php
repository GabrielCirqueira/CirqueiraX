<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\RepeticaoDiariaSpotifyDTO;
use App\DataObject\Spotify\Analise\RetrospectivaAnualSpotifyDTO;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Service\Spotify\CacheAnaliseSpotifyService;
use App\Service\Spotify\AplicarImagensAnaliseSpotifyService;
use App\Service\Spotify\CalcularSequenciasSpotifyService;
use App\Repository\AnaliseReproducaoMusicalRepository;

final readonly class ObterRetrospectivaAnualMusicaService
{
    private const int TAMANHO_TOPO = 5;
    private const int MESES_NO_ANO = 12;

    public function __construct(
        private CacheAnaliseSpotifyService $cacheAnalise,
        private AnaliseReproducaoMusicalRepository $analiseRepository,
        private AplicarImagensAnaliseSpotifyService $aplicarImagensService,
        private CalcularSequenciasSpotifyService $calcularSequenciasService,
    ) {}

    public function executar(Usuario $usuario, FiltroFonteMusica $fonte, int $ano): RetrospectivaAnualSpotifyDTO
    {
        return $this->cacheAnalise->lembrar($usuario, 'retrospectiva|' . $ano, fn (): RetrospectivaAnualSpotifyDTO => $this->calcular($usuario, $fonte, $ano), $fonte);
    }

    private function calcular(Usuario $usuario, FiltroFonteMusica $fonte, int $ano): RetrospectivaAnualSpotifyDTO
    {
        $periodo = PeriodoAnaliseSpotifyDTO::doAno($ano);
        $agora = PeriodoAnaliseSpotifyDTO::agoraCalendario();
        $totais = $this->analiseRepository->calcularTotais($usuario, $periodo, $fonte);
        $minutosAnoAnterior = $this->analiseRepository->calcularTotais($usuario, PeriodoAnaliseSpotifyDTO::doAno($ano - 1), $fonte)['minutos'];
        $topArtistas = $this->analiseRepository->listarRankingArtistas($usuario, $periodo, $fonte, self::TAMANHO_TOPO);
        $topMusicas = $this->analiseRepository->listarRankingMusicas($usuario, $periodo, $fonte, self::TAMANHO_TOPO);
        $topAlbuns = $this->analiseRepository->listarRankingAlbuns($usuario, $periodo, $fonte, self::TAMANHO_TOPO);
        $primeiraMusica = $this->analiseRepository->buscarPrimeiraMusica($usuario, $periodo, $fonte);
        $repeticao = RepeticaoDiariaSpotifyDTO::deArray($this->analiseRepository->buscarMaiorRepeticaoDiaria($usuario, $periodo, $fonte));
        $faixasComImagem = array_values(array_filter([...$topMusicas, ...$topAlbuns, $primeiraMusica, $repeticao?->musica]));
        $mapa = $this->aplicarImagensService->mapear($usuario, $faixasComImagem, $topArtistas);

        return new RetrospectivaAnualSpotifyDTO(
            ano: $ano,
            anosDisponiveis: $this->listarAnosDisponiveis($usuario, $fonte, (int) $agora->format('Y')),
            emAndamento: (int) $agora->format('Y') === $ano,
            totais: $totais,
            variacaoMinutosAnoAnterior: $minutosAnoAnterior > 0
                ? (int) round((($totais['minutos'] - $minutosAnoAnterior) / $minutosAnoAnterior) * 100)
                : null,
            topArtistas: $this->aplicarImagensService->aplicar($topArtistas, $mapa),
            topMusicas: $this->aplicarImagensService->aplicar($topMusicas, $mapa),
            topAlbuns: $this->aplicarImagensService->aplicar($topAlbuns, $mapa),
            meses: $this->montarMeses($usuario, $fonte, $periodo, $ano),
            momentoFavorito: $this->buscarMomentoFavorito($usuario, $fonte, $periodo),
            diaRecorde: $this->analiseRepository->buscarDiaRecorde($usuario, $periodo, $fonte),
            sequencias: $this->calcularSequenciasService->calcular(
                $this->analiseRepository->listarDiasOuvidos($usuario, $periodo, $fonte),
                $agora,
            ),
            artistasNovos: $this->analiseRepository->contarArtistasNovos($usuario, $periodo, $fonte),
            musicasNovas: count($this->analiseRepository->listarMusicasNovas($usuario, $periodo, $fonte)),
            primeiraMusica: $primeiraMusica?->comImagem($mapa),
            maiorRepeticaoDiaria: null === $repeticao
                ? null
                : new RepeticaoDiariaSpotifyDTO($repeticao->musica->comImagem($mapa), $repeticao->vezes, $repeticao->data),
            percentualTopArtistas: $totais['minutos'] > 0
                ? round(($this->analiseRepository->calcularMinutosTopArtistas($usuario, $periodo, $fonte, self::TAMANHO_TOPO) / $totais['minutos']) * 100, 1)
                : 0.0,
        );
    }

    /**
     * @return list<int>
     */
    private function listarAnosDisponiveis(Usuario $usuario, FiltroFonteMusica $fonte, int $anoAtual): array
    {
        $anos = array_unique([
            $anoAtual,
            ...array_column($this->analiseRepository->calcularEvolucaoMensal($usuario, PeriodoAnaliseSpotifyDTO::todos(), $fonte), 'ano'),
        ]);
        rsort($anos);

        return array_values($anos);
    }

    /**
     * @return list<array{ano: int, mes: int, streams: int, minutos: int}>
     */
    private function montarMeses(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoAnaliseSpotifyDTO $periodo, int $ano): array
    {
        $porMes = array_column($this->analiseRepository->calcularEvolucaoMensal($usuario, $periodo, $fonte), null, 'mes');
        $meses = [];

        for ($mes = 1; $mes <= self::MESES_NO_ANO; ++$mes) {
            $meses[] = $porMes[$mes] ?? ['ano' => $ano, 'mes' => $mes, 'streams' => 0, 'minutos' => 0];
        }

        return $meses;
    }

    /**
     * @return array{diaSemana: int, hora: int, minutos: int}|null
     */
    private function buscarMomentoFavorito(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoAnaliseSpotifyDTO $periodo): ?array
    {
        $celulas = $this->analiseRepository->calcularMapaHorarios($usuario, $periodo, $fonte);
        usort($celulas, static fn (array $a, array $b): int => $b['minutos'] <=> $a['minutos']);
        $favorita = $celulas[0] ?? null;

        if (null === $favorita) {
            return null;
        }

        return ['diaSemana' => $favorita['diaSemana'], 'hora' => $favorita['hora'], 'minutos' => $favorita['minutos']];
    }
}
