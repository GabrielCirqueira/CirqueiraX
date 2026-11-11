<?php

declare(strict_types=1);

namespace App\DataObject\Spotify\Analise;

final readonly class DetalheArtistaSpotifyDTO
{
    /**
     * @param list<array{ano: int, mes: int, streams: int, minutos: int}> $evolucao
     * @param list<array{ano: int, mes: int, posicao: int}> $mesesNoTopo
     * @param list<MusicaAnaliseSpotifyDTO> $topMusicas
     * @param list<AlbumAnaliseSpotifyDTO> $topAlbuns
     * @param array<string, array{streams: int, minutos: int, primeira: ?string, ultima: ?string}> $porFonte
     * @param list<MusicaAnaliseSpotifyDTO> $mashups
     */
    public function __construct(
        public ArtistaAnaliseSpotifyDTO $artista,
        public int $reproducoes,
        public int $faixasDistintas,
        public int $albunsDistintos,
        public int $diasOuvidos,
        public ?string $primeiraVezEm,
        public ?string $ultimaVezEm,
        public ?int $posicaoGeral,
        public float $percentualDoTempoTotal,
        public array $evolucao,
        public array $mesesNoTopo,
        public array $topMusicas,
        public array $topAlbuns,
        public ?RepeticaoDiariaSpotifyDTO $maiorRepeticaoDiaria,
        public ComportamentoReproducaoSpotifyDTO $comportamento,
        public array $porFonte = [],
        public int $minutosEstimados = 0,
        public array $mashups = [],
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'artista' => $this->artista->paraArray(),
            'reproducoes' => $this->reproducoes,
            'faixasDistintas' => $this->faixasDistintas,
            'albunsDistintos' => $this->albunsDistintos,
            'diasOuvidos' => $this->diasOuvidos,
            'primeiraVezEm' => $this->primeiraVezEm,
            'ultimaVezEm' => $this->ultimaVezEm,
            'posicaoGeral' => $this->posicaoGeral,
            'percentualDoTempoTotal' => $this->percentualDoTempoTotal,
            'evolucao' => $this->evolucao,
            'mesesNoTopo' => $this->mesesNoTopo,
            'topMusicas' => array_map(static fn (MusicaAnaliseSpotifyDTO $item): array => $item->paraArray(), $this->topMusicas),
            'topAlbuns' => array_map(static fn (AlbumAnaliseSpotifyDTO $item): array => $item->paraArray(), $this->topAlbuns),
            'maiorRepeticaoDiaria' => $this->maiorRepeticaoDiaria?->paraArray(),
            'comportamento' => $this->comportamento->paraArray(),
            'porFonte' => $this->porFonte,
            'minutosEstimados' => $this->minutosEstimados,
            'mashups' => array_map(static fn (MusicaAnaliseSpotifyDTO $item): array => $item->paraArray(), $this->mashups),
        ];
    }
}
