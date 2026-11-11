<?php

declare(strict_types=1);

namespace App\DataObject\Spotify\Analise;

use App\DataObject\Spotify\MapaImagensSpotifyDTO;
use App\Entity\ImagemSpotify;
use App\Enum\FonteReproducaoMusical;

final readonly class ArtistaAnaliseSpotifyDTO
{
    private const int MS_POR_MINUTO = 60000;

    /**
     * @param list<string> $fontes
     * @param array<string, array{streams: int, minutos: int}> $porFonte
     */
    public function __construct(
        public string $nome,
        public ?string $codigoArtista,
        public int $streams,
        public int $minutos,
        public ?string $imagemUrl = null,
        public ?string $urlSpotify = null,
        public ?string $artistaUuid = null,
        public array $fontes = [],
        public array $porFonte = [],
        public bool $estimado = false,
    ) {}

    /**
     * @param array<string, mixed> $linha
     */
    public static function daLinha(array $linha): self
    {
        $codigo = is_string($linha['codigo_artista'] ?? null) && '' !== trim($linha['codigo_artista']) ? trim($linha['codigo_artista']) : null;

        /** @var list<string> $fontes */
        $fontes = $linha['fontes'] ?? [];
        /** @var array<string, array{streams: int, minutos: int}> $porFonte */
        $porFonte = $linha['por_fonte'] ?? [];

        return new self(
            (string) $linha['artista'],
            $codigo,
            (int) ($linha['streams'] ?? 0),
            (int) round(((int) ($linha['ms'] ?? 0)) / self::MS_POR_MINUTO),
            is_string($linha['url_foto'] ?? null) ? $linha['url_foto'] : null,
            null,
            is_string($linha['artista_uuid'] ?? null) ? $linha['artista_uuid'] : null,
            $fontes,
            $porFonte,
            (bool) ($linha['estimado'] ?? false),
        );
    }

    public function temSpotify(): bool
    {
        return null !== $this->codigoArtista || null === $this->artistaUuid || in_array(FonteReproducaoMusical::Spotify->value, $this->fontes, true);
    }

    public function chaveImagem(): string
    {
        return ImagemSpotify::gerarChaveArtista($this->codigoArtista, $this->nome);
    }

    public function chaveIdentificacao(): string
    {
        return $this->artistaUuid ?? mb_strtolower(trim($this->nome));
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
        $urlSpotify = $this->temSpotify()
            ? $mapa->obterUrlSpotify($chave, ImagemSpotify::gerarUrlSpotifyArtista($this->codigoArtista, $this->nome))
            : null;

        return new self(
            $this->nome,
            $this->codigoArtista,
            $this->streams,
            $this->minutos,
            $mapa->obterImagem($chave) ?? $this->imagemUrl,
            $urlSpotify,
            $this->artistaUuid,
            $this->fontes,
            $this->porFonte,
            $this->estimado,
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
            'artistaUuid' => $this->artistaUuid,
            'fontes' => $this->fontes,
            'porFonte' => $this->porFonte,
            'estimado' => $this->estimado,
        ];
    }
}
