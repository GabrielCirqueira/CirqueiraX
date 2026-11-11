<?php

declare(strict_types=1);

namespace App\Service\Musica\Projecao;

use App\DataObject\Spotify\Analise\ArtistaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\MusicaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Repository\AnaliseReproducaoMusicalRepository;
use App\Repository\AnaliseReproducaoSpotifyRepository;
use App\Service\Musica\NormalizarTextoMusicaService;

final readonly class CompararParidadeSpotifyService
{
    public const int TAMANHO_TOPO = 20;
    private const array CAMPOS_TOTAIS = ['minutos' => 'minutos', 'streams' => 'streams', 'reproducoes' => 'reproducoes', 'faixas' => 'musicas', 'artistas' => 'artistas', 'dias' => 'dias'];

    public function __construct(
        private AnaliseReproducaoSpotifyRepository $analiseAntiga,
        private AnaliseReproducaoMusicalRepository $analiseNova,
        private NormalizarTextoMusicaService $normalizador,
    ) {
    }

    /**
     * @param list<PeriodoAnaliseSpotifyDTO> $periodos
     *
     * @return list<array{periodo: string, metrica: string, antigo: string, novo: string}>
     */
    public function executar(Usuario $usuario, array $periodos): array
    {
        $diferencas = [];

        foreach ($periodos as $periodo) {
            array_push(
                $diferencas,
                ...$this->compararTotais($usuario, $periodo),
                ...$this->compararMusicas($usuario, $periodo),
                ...$this->compararArtistas($usuario, $periodo),
            );
        }

        return $diferencas;
    }

    /**
     * @return list<array{periodo: string, metrica: string, antigo: string, novo: string}>
     */
    private function compararTotais(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        $antigo = $this->analiseAntiga->calcularTotais($usuario, $periodo);
        $novo = $this->analiseNova->calcularTotais($usuario, $periodo, FiltroFonteMusica::Spotify);
        $diferencas = [];

        foreach (self::CAMPOS_TOTAIS as $campoAntigo => $campoNovo) {
            if ($antigo[$campoAntigo] !== $novo[$campoNovo]) {
                $diferencas[] = $this->diferenca($periodo, 'total de '.$campoAntigo, (string) $antigo[$campoAntigo], (string) $novo[$campoNovo]);
            }
        }

        return $diferencas;
    }

    /**
     * @return list<array{periodo: string, metrica: string, antigo: string, novo: string}>
     */
    private function compararMusicas(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        $antigas = array_map(
            fn (MusicaAnaliseSpotifyDTO $musica): string => sprintf('%s (%d)', $this->normalizador->normalizarTitulo($musica->nomeFaixa), $musica->streams),
            $this->analiseAntiga->listarRankingMusicas($usuario, $periodo, self::TAMANHO_TOPO),
        );
        $novas = array_map(
            fn (MusicaAnaliseSpotifyDTO $musica): string => sprintf('%s (%d)', $this->normalizador->normalizarTitulo($musica->nomeFaixa), $musica->streams),
            $this->analiseNova->listarRankingMusicas($usuario, $periodo, FiltroFonteMusica::Spotify, self::TAMANHO_TOPO),
        );

        return $this->compararListas($periodo, 'top músicas', $antigas, $novas);
    }

    /**
     * @return list<array{periodo: string, metrica: string, antigo: string, novo: string}>
     */
    private function compararArtistas(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        $antigos = array_map(
            fn (ArtistaAnaliseSpotifyDTO $artista): string => sprintf('%s (%d)', $this->normalizador->normalizar($artista->nome), $artista->streams),
            $this->analiseAntiga->listarRankingArtistas($usuario, $periodo, self::TAMANHO_TOPO),
        );
        $novos = array_map(
            fn (ArtistaAnaliseSpotifyDTO $artista): string => sprintf('%s (%d)', $this->normalizador->normalizar($artista->nome), $artista->streams),
            $this->analiseNova->listarRankingArtistas($usuario, $periodo, FiltroFonteMusica::Spotify, self::TAMANHO_TOPO),
        );

        return $this->compararListas($periodo, 'top artistas', $antigos, $novos);
    }

    /**
     * @param list<string> $antigos
     * @param list<string> $novos
     *
     * @return list<array{periodo: string, metrica: string, antigo: string, novo: string}>
     */
    private function compararListas(PeriodoAnaliseSpotifyDTO $periodo, string $metrica, array $antigos, array $novos): array
    {
        $diferencas = [];
        $tamanho = max(count($antigos), count($novos));

        for ($posicao = 0; $posicao < $tamanho; ++$posicao) {
            $antigo = $antigos[$posicao] ?? '-';
            $novo = $novos[$posicao] ?? '-';

            if ($antigo !== $novo) {
                $diferencas[] = $this->diferenca($periodo, sprintf('%s #%d', $metrica, $posicao + 1), $antigo, $novo);
            }
        }

        return $diferencas;
    }

    /**
     * @return array{periodo: string, metrica: string, antigo: string, novo: string}
     */
    private function diferenca(PeriodoAnaliseSpotifyDTO $periodo, string $metrica, string $antigo, string $novo): array
    {
        return ['periodo' => $periodo->rotulo, 'metrica' => $metrica, 'antigo' => $antigo, 'novo' => $novo];
    }
}
