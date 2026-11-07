<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

use App\DataObject\Spotify\Analise\AlbumAnaliseSpotifyDTO;

final readonly class ResumoIntervaloComImagensDTO
{
    /**
     * @param list<AlbumAnaliseSpotifyDTO> $topAlbuns
     */
    public function __construct(
        private ResumoIntervaloSpotifyDTO $intervalo,
        private string $rotuloPeriodo,
        private string $dataInicio,
        private string $dataFim,
        private MapaImagensSpotifyDTO $mapaImagens,
        private array $topAlbuns = [],
    ) {}

    /**
     * @return list<AlbumAnaliseSpotifyDTO>
     */
    public function topAlbuns(): array
    {
        return $this->topAlbuns;
    }

    public function intervalo(): ResumoIntervaloSpotifyDTO
    {
        return $this->intervalo;
    }

    public function rotuloPeriodo(): string
    {
        return $this->rotuloPeriodo;
    }

    public function dataInicio(): string
    {
        return $this->dataInicio;
    }

    public function dataFim(): string
    {
        return $this->dataFim;
    }

    public function mapaImagens(): MapaImagensSpotifyDTO
    {
        return $this->mapaImagens;
    }
}
