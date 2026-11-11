<?php

declare(strict_types=1);

namespace App\DataObject\Spotify\Analise;

final readonly class DetalheMusicaSpotifyDTO
{
    /**
     * @param list<array{ano: int, mes: int, streams: int, minutos: int}> $evolucao
     * @param list<array{ano: int, mes: int, posicao: int}> $mesesNoTopo
     * @param list<MusicaAnaliseSpotifyDTO> $outrasDoArtista
     * @param array<string, array{streams: int, minutos: int, primeira: ?string, ultima: ?string}> $porFonte
     * @param list<array<string, mixed>> $variantes
     * @param list<array{texto: string, musicaUuid: ?string, titulo: ?string}> $componentes
     */
    public function __construct(
        public MusicaAnaliseSpotifyDTO $musica,
        public ArtistaAnaliseSpotifyDTO $artista,
        public int $reproducoes,
        public int $diasOuvidos,
        public ?string $primeiraVezEm,
        public ?string $ultimaVezEm,
        public ?int $posicaoGeral,
        public ?int $duracaoMs,
        public array $evolucao,
        public array $mesesNoTopo,
        public ?RepeticaoDiariaSpotifyDTO $recordeDiario,
        public ComportamentoReproducaoSpotifyDTO $comportamento,
        public array $outrasDoArtista,
        public array $porFonte = [],
        public int $minutosEstimados = 0,
        public array $variantes = [],
        public array $componentes = [],
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'musica' => $this->musica->paraArray(),
            'artista' => $this->artista->paraArray(),
            'reproducoes' => $this->reproducoes,
            'diasOuvidos' => $this->diasOuvidos,
            'primeiraVezEm' => $this->primeiraVezEm,
            'ultimaVezEm' => $this->ultimaVezEm,
            'posicaoGeral' => $this->posicaoGeral,
            'duracaoMs' => $this->duracaoMs,
            'evolucao' => $this->evolucao,
            'mesesNoTopo' => $this->mesesNoTopo,
            'recordeDiario' => $this->recordeDiario?->paraArray(),
            'comportamento' => $this->comportamento->paraArray(),
            'outrasDoArtista' => array_map(static fn (MusicaAnaliseSpotifyDTO $item): array => $item->paraArray(), $this->outrasDoArtista),
            'porFonte' => $this->porFonte,
            'minutosEstimados' => $this->minutosEstimados,
            'variantes' => $this->variantes,
            'componentes' => $this->componentes,
        ];
    }
}
