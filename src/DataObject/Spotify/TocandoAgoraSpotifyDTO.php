<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class TocandoAgoraSpotifyDTO
{
    /**
     * @param list<string> $artistas
     */
    public function __construct(
        public bool $temItem,
        public bool $emReproducao,
        public string $tipo,
        public ?string $codigoFaixa = null,
        public ?string $nome = null,
        public array $artistas = [],
        public ?string $codigoArtista = null,
        public ?string $album = null,
        public ?string $capaUrl = null,
        public int $duracaoMs = 0,
        public int $progressoMs = 0,
        public ?string $urlSpotify = null,
        public int $vezesOuvida = 0,
        public ?string $primeiraVezEm = null,
    ) {}

    public static function nada(): self
    {
        return new self(false, false, 'nada');
    }

    public function comHistorico(int $vezesOuvida, ?string $primeiraVezEm): self
    {
        return new self(
            $this->temItem,
            $this->emReproducao,
            $this->tipo,
            $this->codigoFaixa,
            $this->nome,
            $this->artistas,
            $this->codigoArtista,
            $this->album,
            $this->capaUrl,
            $this->duracaoMs,
            $this->progressoMs,
            $this->urlSpotify,
            $vezesOuvida,
            $primeiraVezEm,
        );
    }

    public function artistaPrincipal(): ?string
    {
        return $this->artistas[0] ?? null;
    }

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'temItem' => $this->temItem,
            'emReproducao' => $this->emReproducao,
            'tipo' => $this->tipo,
            'codigoFaixa' => $this->codigoFaixa,
            'nome' => $this->nome,
            'artistas' => $this->artistas,
            'codigoArtista' => $this->codigoArtista,
            'album' => $this->album,
            'capaUrl' => $this->capaUrl,
            'duracaoMs' => $this->duracaoMs,
            'progressoMs' => $this->progressoMs,
            'urlSpotify' => $this->urlSpotify,
            'vezesOuvida' => $this->vezesOuvida,
            'primeiraVezEm' => $this->primeiraVezEm,
        ];
    }
}
