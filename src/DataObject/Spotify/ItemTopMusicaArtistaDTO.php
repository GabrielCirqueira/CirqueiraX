<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

use App\DataObject\Spotify\Analise\MusicaAnaliseSpotifyDTO;

final readonly class ItemTopMusicaArtistaDTO
{
    public function __construct(
        public string $nomeFaixa,
        public ?string $codigoFaixa,
        public string $album,
        public int $totalStreams,
        public int $totalMinutos,
        public ?string $urlSpotify = null,
        public ?string $imagemUrl = null,
        public ?MusicaAnaliseSpotifyDTO $analise = null,
    ) {
    }

    public static function daAnalise(MusicaAnaliseSpotifyDTO $musica): self
    {
        return new self($musica->nomeFaixa, $musica->codigoFaixa, $musica->album, $musica->streams, $musica->minutos, $musica->urlSpotify, $musica->imagemUrl, $musica);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'nomeFaixa' => $this->nomeFaixa,
            'codigoFaixa' => $this->codigoFaixa,
            'album' => $this->album,
            'totalStreams' => $this->totalStreams,
            'totalMinutos' => $this->totalMinutos,
            'urlSpotify' => $this->urlSpotify,
            'imagemUrl' => $this->imagemUrl,
            'musicaUuid' => $this->analise?->musicaUuid,
            'artistas' => $this->analise->artistas ?? [],
            'fontes' => $this->analise->fontes ?? [],
            'porFonte' => $this->analise->porFonte ?? [],
            'mashup' => $this->analise->mashup ?? false,
            'estimado' => $this->analise->estimado ?? false,
            'urlYoutubeMusic' => $this->analise?->urlYoutubeMusic,
        ];
    }
}

