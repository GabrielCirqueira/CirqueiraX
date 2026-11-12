<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

use App\DataObject\Spotify\Analise\AlbumAnaliseSpotifyDTO;

final readonly class CapsulaMensalSpotifyDTO
{
    /**
     * @param array<int, ItemRankingMusicaCapsulaDTO> $topMusicas
     * @param array<int, ItemRankingArtistaCapsulaDTO> $topArtistas
     * @param array<int, MinutosPorDiaDTO> $minutosPorDia
     * @param list<AlbumAnaliseSpotifyDTO> $topAlbuns
     */
    public function __construct(
        private int $ano,
        private int $mes,
        private string $rotulo,
        private bool $emAndamento,
        private \DateTimeImmutable $calculadoEm,
        private int $totalMinutos,
        private int $totalStreams,
        private int $faixasDistintas,
        private ?int $variacaoFaixasDistintasPercentual,
        private ?ItemRankingMusicaCapsulaDTO $musicaMaisOuvida,
        private ?ItemRankingArtistaCapsulaDTO $artistaMaisOuvido,
        private array $topMusicas,
        private array $topArtistas,
        private array $minutosPorDia,
        private array $topAlbuns = [],
    ) {}

    public function ano(): int
    {
        return $this->ano;
    }

    public function mes(): int
    {
        return $this->mes;
    }

    public function rotulo(): string
    {
        return $this->rotulo;
    }

    public function isEmAndamento(): bool
    {
        return $this->emAndamento;
    }

    public function calculadoEm(): \DateTimeImmutable
    {
        return $this->calculadoEm;
    }

    public function totalMinutos(): int
    {
        return $this->totalMinutos;
    }

    public function totalStreams(): int
    {
        return $this->totalStreams;
    }

    public function faixasDistintas(): int
    {
        return $this->faixasDistintas;
    }

    public function variacaoFaixasDistintasPercentual(): ?int
    {
        return $this->variacaoFaixasDistintasPercentual;
    }

    public function musicaMaisOuvida(): ?ItemRankingMusicaCapsulaDTO
    {
        return $this->musicaMaisOuvida;
    }

    public function artistaMaisOuvido(): ?ItemRankingArtistaCapsulaDTO
    {
        return $this->artistaMaisOuvido;
    }

    /**
     * @return array<int, ItemRankingMusicaCapsulaDTO>
     */
    public function topMusicas(): array
    {
        return $this->topMusicas;
    }

    /**
     * @return array<int, ItemRankingArtistaCapsulaDTO>
     */
    public function topArtistas(): array
    {
        return $this->topArtistas;
    }

    /**
     * @return array<int, MinutosPorDiaDTO>
     */
    public function minutosPorDia(): array
    {
        return $this->minutosPorDia;
    }

    /**
     * @return list<AlbumAnaliseSpotifyDTO>
     */
    public function topAlbuns(): array
    {
        return $this->topAlbuns;
    }
}

