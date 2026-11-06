<?php

declare(strict_types=1);

namespace App\DataObject\Spotify\Analise;

use App\DataObject\Spotify\MapaImagensSpotifyDTO;
use App\Entity\ImagemSpotify;

final readonly class ArtistaAnaliseSpotifyDTO
{
    public function __construct(
        public string $nome,
        public ?string $codigoArtista,
        public int $streams,
        public int $minutos,
        public ?string $imagemUrl = null,
        public ?string $urlSpotify = null,
    ) {}

    /**
     * @param array<string, mixed> $linha
     */
    public static function daLinha(array $linha): self
    {
        $codigo = is_string($linha['codigo_artista'] ?? null) && '' !== trim($linha['codigo_artista']) ? trim($linha['codigo_artista']) : null;

        return new self(
            (string) $linha['artista'],
            $codigo,
            (int) ($linha['streams'] ?? 0),
            (int) round(((int) ($linha['ms'] ?? 0)) / 60000),
        );
    }

    public function chaveImagem(): string
    {
        return ImagemSpotify::gerarChaveArtista($this->codigoArtista, $this->nome);
    }

    /**
     * @return array{codigo: ?string, nome: string}
     */
    public function paraEnriquecimento(): array
    {
        return ['codigo' => $this->codigoArtista, 'nome' => $this->nome];
    }

    public function comImagem(MapaImagensSpotifyDTO $mapa): self
    {
        $chave = $this->chaveImagem();

        return new self(
            $this->nome,
            $this->codigoArtista,
            $this->streams,
            $this->minutos,
            $mapa->obterImagem($chave),
            $mapa->obterUrlSpotify($chave, ImagemSpotify::gerarUrlSpotifyArtista($this->codigoArtista, $this->nome)),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'nome' => $this->nome,
            'codigoArtista' => $this->codigoArtista,
            'streams' => $this->streams,
            'minutos' => $this->minutos,
            'imagemUrl' => $this->imagemUrl,
            'urlSpotify' => $this->urlSpotify,
        ];
    }
}
