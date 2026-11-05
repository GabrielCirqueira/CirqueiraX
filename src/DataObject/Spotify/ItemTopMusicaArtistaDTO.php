<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

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
    ) {
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
        ];
    }
}

