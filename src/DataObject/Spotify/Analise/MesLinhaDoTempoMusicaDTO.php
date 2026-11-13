<?php

declare(strict_types=1);

namespace App\DataObject\Spotify\Analise;

use App\DataObject\Spotify\MapaImagensSpotifyDTO;

final readonly class MesLinhaDoTempoMusicaDTO
{
    /**
     * @param list<MusicaAnaliseSpotifyDTO> $musicas
     * @param list<int|null> $posicoesAnterioresMusicas
     * @param list<ArtistaAnaliseSpotifyDTO> $artistas
     * @param list<int|null> $posicoesAnterioresArtistas
     */
    public function __construct(
        public int $ano,
        public int $mes,
        public int $totalMinutos,
        public int $totalReproducoes,
        public bool $emAndamento,
        public array $musicas,
        public array $posicoesAnterioresMusicas,
        public array $artistas,
        public array $posicoesAnterioresArtistas,
    ) {}

    public function comImagens(MapaImagensSpotifyDTO $mapa): self
    {
        return new self(
            $this->ano,
            $this->mes,
            $this->totalMinutos,
            $this->totalReproducoes,
            $this->emAndamento,
            array_map(static fn (MusicaAnaliseSpotifyDTO $musica): MusicaAnaliseSpotifyDTO => $musica->comImagem($mapa), $this->musicas),
            $this->posicoesAnterioresMusicas,
            array_map(static fn (ArtistaAnaliseSpotifyDTO $artista): ArtistaAnaliseSpotifyDTO => $artista->comImagem($mapa), $this->artistas),
            $this->posicoesAnterioresArtistas,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'ano' => $this->ano,
            'mes' => $this->mes,
            'totalMinutos' => $this->totalMinutos,
            'totalReproducoes' => $this->totalReproducoes,
            'emAndamento' => $this->emAndamento,
            'musicas' => array_map(fn (MusicaAnaliseSpotifyDTO $musica, int $indice): array => [
                ...$musica->paraArray(),
                'posicao' => $indice + 1,
                'posicaoAnterior' => $this->posicoesAnterioresMusicas[$indice] ?? null,
            ], $this->musicas, array_keys($this->musicas)),
            'artistas' => array_map(fn (ArtistaAnaliseSpotifyDTO $artista, int $indice): array => [
                ...$artista->paraArray(),
                'posicao' => $indice + 1,
                'posicaoAnterior' => $this->posicoesAnterioresArtistas[$indice] ?? null,
            ], $this->artistas, array_keys($this->artistas)),
        ];
    }
}
