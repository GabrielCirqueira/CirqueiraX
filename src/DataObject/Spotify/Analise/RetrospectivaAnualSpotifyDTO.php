<?php

declare(strict_types=1);

namespace App\DataObject\Spotify\Analise;

final readonly class RetrospectivaAnualSpotifyDTO
{
    /**
     * @param list<int> $anosDisponiveis
     * @param array{minutos: int, streams: int, reproducoes: int, artistas: int, faixas: int, dias: int, primeira: ?string, ultima: ?string} $totais
     * @param list<ArtistaAnaliseSpotifyDTO> $topArtistas
     * @param list<MusicaAnaliseSpotifyDTO> $topMusicas
     * @param list<AlbumAnaliseSpotifyDTO> $topAlbuns
     * @param list<array{ano: int, mes: int, streams: int, minutos: int}> $meses
     * @param array{diaSemana: int, hora: int, minutos: int}|null $momentoFavorito
     * @param array{data: string, minutos: int}|null $diaRecorde
     */
    public function __construct(
        public int $ano,
        public array $anosDisponiveis,
        public bool $emAndamento,
        public array $totais,
        public ?int $variacaoMinutosAnoAnterior,
        public array $topArtistas,
        public array $topMusicas,
        public array $topAlbuns,
        public array $meses,
        public ?array $momentoFavorito,
        public ?array $diaRecorde,
        public SequenciasSpotifyDTO $sequencias,
        public int $artistasNovos,
        public int $musicasNovas,
        public ?MusicaAnaliseSpotifyDTO $primeiraMusica,
        public ?RepeticaoDiariaSpotifyDTO $maiorRepeticaoDiaria,
        public float $percentualTopArtistas,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'ano' => $this->ano,
            'anosDisponiveis' => $this->anosDisponiveis,
            'emAndamento' => $this->emAndamento,
            'totalMinutos' => $this->totais['minutos'],
            'totalStreams' => $this->totais['streams'],
            'artistasDistintos' => $this->totais['artistas'],
            'faixasDistintas' => $this->totais['faixas'],
            'diasOuvindo' => $this->totais['dias'],
            'variacaoMinutosAnoAnterior' => $this->variacaoMinutosAnoAnterior,
            'topArtistas' => array_map(static fn (ArtistaAnaliseSpotifyDTO $item): array => $item->paraArray(), $this->topArtistas),
            'topMusicas' => array_map(static fn (MusicaAnaliseSpotifyDTO $item): array => $item->paraArray(), $this->topMusicas),
            'topAlbuns' => array_map(static fn (AlbumAnaliseSpotifyDTO $item): array => $item->paraArray(), $this->topAlbuns),
            'meses' => $this->meses,
            'momentoFavorito' => $this->momentoFavorito,
            'diaRecorde' => $this->diaRecorde,
            'maiorSequencia' => $this->sequencias->maior,
            'inicioMaiorSequencia' => $this->sequencias->inicioMaior,
            'fimMaiorSequencia' => $this->sequencias->fimMaior,
            'artistasNovos' => $this->artistasNovos,
            'musicasNovas' => $this->musicasNovas,
            'primeiraMusica' => $this->primeiraMusica?->paraArray(),
            'maiorRepeticaoDiaria' => $this->maiorRepeticaoDiaria?->paraArray(),
            'percentualTopArtistas' => $this->percentualTopArtistas,
        ];
    }
}
