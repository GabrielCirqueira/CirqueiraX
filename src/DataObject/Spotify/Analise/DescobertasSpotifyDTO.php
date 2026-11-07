<?php

declare(strict_types=1);

namespace App\DataObject\Spotify\Analise;

use DateTimeImmutable;

final readonly class DescobertasSpotifyDTO
{
    /**
     * @param list<array{artista: ArtistaAnaliseSpotifyDTO, primeira: string}> $artistasNovos
     * @param list<array{musica: MusicaAnaliseSpotifyDTO, primeira: string}> $musicasNovas
     * @param list<array{artista: ArtistaAnaliseSpotifyDTO, ultimaAntes: string, voltouEm: string}> $redescobertas
     * @param list<array{musica: MusicaAnaliseSpotifyDTO, vezesNaJanela: int, fimJanela: string, total: int}> $obsessoes
     */
    public function __construct(
        public PeriodoAnaliseSpotifyDTO $periodo,
        public int $totalArtistasNovos,
        public int $totalMusicasNovas,
        public array $artistasNovos,
        public array $musicasNovas,
        public array $redescobertas,
        public array $obsessoes,
        public int $diasJanelaObsessao,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'periodo' => $this->periodo->paraArray(),
            'totalArtistasNovos' => $this->totalArtistasNovos,
            'totalMusicasNovas' => $this->totalMusicasNovas,
            'diasJanelaObsessao' => $this->diasJanelaObsessao,
            'artistasNovos' => array_map(static fn (array $item): array => [
                'artista' => $item['artista']->paraArray(),
                'primeiraVezEm' => PeriodoAnaliseSpotifyDTO::utcParaIsoLocal($item['primeira']),
            ], $this->artistasNovos),
            'musicasNovas' => array_map(static fn (array $item): array => [
                'musica' => $item['musica']->paraArray(),
                'primeiraVezEm' => PeriodoAnaliseSpotifyDTO::utcParaIsoLocal($item['primeira']),
            ], $this->musicasNovas),
            'redescobertas' => array_map(static fn (array $item): array => [
                'artista' => $item['artista']->paraArray(),
                'ultimaVezAntes' => PeriodoAnaliseSpotifyDTO::utcParaIsoLocal($item['ultimaAntes']),
                'voltouEm' => PeriodoAnaliseSpotifyDTO::utcParaIsoLocal($item['voltouEm']),
                'diasAusente' => (int) (new DateTimeImmutable($item['ultimaAntes']))->diff(new DateTimeImmutable($item['voltouEm']))->days,
            ], $this->redescobertas),
            'obsessoes' => array_map(fn (array $item): array => [
                'musica' => $item['musica']->paraArray(),
                'vezesNaJanela' => $item['vezesNaJanela'],
                'totalNoPeriodo' => $item['total'],
                'fimJanela' => PeriodoAnaliseSpotifyDTO::utcParaIsoLocal($item['fimJanela']),
                'inicioJanela' => PeriodoAnaliseSpotifyDTO::utcParaIsoLocal(
                    (new DateTimeImmutable($item['fimJanela']))->modify(sprintf('-%d days', $this->diasJanelaObsessao))->format('Y-m-d H:i:s'),
                ),
            ], $this->obsessoes),
        ];
    }
}
