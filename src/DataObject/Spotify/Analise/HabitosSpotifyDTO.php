<?php

declare(strict_types=1);

namespace App\DataObject\Spotify\Analise;

final readonly class HabitosSpotifyDTO
{
    /**
     * @param list<array{diaSemana: int, hora: int, minutos: int, streams: int}> $mapaHorarios
     * @param list<ArtistaAnaliseSpotifyDTO> $topArtistas
     */
    public function __construct(
        public PeriodoAnaliseSpotifyDTO $periodo,
        public int $totalMinutos,
        public int $totalStreams,
        public int $artistasDistintos,
        public array $mapaHorarios,
        public int $minutosTopArtistas,
        public array $topArtistas,
        public int $faixasComStream,
        public int $faixasUmaVez,
        public ComportamentoReproducaoSpotifyDTO $comportamento,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'periodo' => $this->periodo->paraArray(),
            'totalMinutos' => $this->totalMinutos,
            'totalStreams' => $this->totalStreams,
            'mapaHorarios' => $this->mapaHorarios,
            'concentracao' => [
                'artistasDistintos' => $this->artistasDistintos,
                'minutosTopArtistas' => $this->minutosTopArtistas,
                'percentualTopArtistas' => $this->percentual($this->minutosTopArtistas, $this->totalMinutos),
                'topArtistas' => array_map(static fn (ArtistaAnaliseSpotifyDTO $item): array => $item->paraArray(), $this->topArtistas),
                'faixasDistintas' => $this->faixasComStream,
                'faixasUmaVez' => $this->faixasUmaVez,
                'percentualUmaVez' => $this->percentual($this->faixasUmaVez, $this->faixasComStream),
                'streamsPorFaixa' => $this->faixasComStream > 0 ? round($this->totalStreams / $this->faixasComStream, 1) : 0.0,
                'percentualRepeticao' => $this->totalStreams > 0
                    ? round((($this->totalStreams - $this->faixasComStream) / $this->totalStreams) * 100, 1)
                    : 0.0,
            ],
            'comportamento' => $this->comportamento->paraArray(),
        ];
    }

    private function percentual(int $parte, int $total): float
    {
        return $total > 0 ? round(($parte / $total) * 100, 1) : 0.0;
    }
}
