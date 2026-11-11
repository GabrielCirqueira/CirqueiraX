<?php

declare(strict_types=1);

namespace App\DataObject\Spotify\Analise;

use App\DataObject\Spotify\MapaImagensSpotifyDTO;
use App\Entity\ImagemSpotify;
use App\Enum\FonteReproducaoMusical;

final readonly class MusicaAnaliseSpotifyDTO
{
    private const int MS_POR_MINUTO = 60000;
    private const string ALBUM_DESCONHECIDO = 'Desconhecido';

    /**
     * @param list<string> $fontes
     * @param array<string, array{streams: int, minutos: int}> $porFonte
     * @param list<string> $artistas
     */
    public function __construct(
        public string $nomeFaixa,
        public string $artista,
        public ?string $codigoFaixa,
        public string $album,
        public int $streams,
        public int $minutos,
        public ?string $imagemUrl = null,
        public ?string $urlSpotify = null,
        public ?string $musicaUuid = null,
        public array $fontes = [],
        public array $porFonte = [],
        public bool $mashup = false,
        public bool $estimado = false,
        public ?string $urlYoutubeMusic = null,
        public array $artistas = [],
    ) {}

    /**
     * @param array<string, mixed> $linha
     */
    public static function daLinha(array $linha): self
    {
        $codigo = is_string($linha['codigo_faixa'] ?? null) && '' !== trim($linha['codigo_faixa']) ? trim($linha['codigo_faixa']) : null;
        $album = is_string($linha['album'] ?? null) && '' !== trim($linha['album']) ? $linha['album'] : self::ALBUM_DESCONHECIDO;

        /** @var list<string> $fontes */
        $fontes = $linha['fontes'] ?? [];
        /** @var array<string, array{streams: int, minutos: int}> $porFonte */
        $porFonte = $linha['por_fonte'] ?? [];
        /** @var list<string> $artistas */
        $artistas = $linha['artistas'] ?? [];

        return new self(
            (string) $linha['nome_faixa'],
            (string) $linha['artista'],
            $codigo,
            $album,
            (int) ($linha['streams'] ?? 0),
            (int) round(((int) ($linha['ms'] ?? 0)) / self::MS_POR_MINUTO),
            is_string($linha['url_capa'] ?? null) ? $linha['url_capa'] : null,
            null,
            is_string($linha['musica_uuid'] ?? null) ? $linha['musica_uuid'] : null,
            $fontes,
            $porFonte,
            (bool) ($linha['mashup'] ?? false),
            (bool) ($linha['estimado'] ?? false),
            is_string($linha['url_youtube_music'] ?? null) ? $linha['url_youtube_music'] : null,
            $artistas,
        );
    }

    public function temSpotify(): bool
    {
        return null !== $this->codigoFaixa || null === $this->musicaUuid || in_array(FonteReproducaoMusical::Spotify->value, $this->fontes, true);
    }

    public function chaveImagem(): string
    {
        return ImagemSpotify::gerarChaveFaixa($this->codigoFaixa, $this->artista, $this->nomeFaixa);
    }

    public function chaveIdentificacao(): string
    {
        return $this->musicaUuid ?? mb_strtolower(trim($this->nomeFaixa).'|'.trim($this->artista));
    }

    /**
     * @return array{codigo: ?string, nome: string, artista: string}
     */
    public function paraEnriquecimento(): array
    {
        return ['codigo' => $this->codigoFaixa, 'nome' => $this->nomeFaixa, 'artista' => $this->artista];
    }

    public function comImagem(MapaImagensSpotifyDTO $mapa): self
    {
        $chave = $this->chaveImagem();
        $urlSpotify = $this->temSpotify()
            ? $mapa->obterUrlSpotify($chave, ImagemSpotify::gerarUrlSpotifyFaixa($this->codigoFaixa, $this->artista, $this->nomeFaixa))
            : null;

        return new self(
            $this->nomeFaixa,
            $this->artista,
            $this->codigoFaixa,
            $this->album,
            $this->streams,
            $this->minutos,
            $mapa->obterImagem($chave) ?? $this->imagemUrl,
            $urlSpotify,
            $this->musicaUuid,
            $this->fontes,
            $this->porFonte,
            $this->mashup,
            $this->estimado,
            $this->urlYoutubeMusic,
            $this->artistas,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'nomeFaixa' => $this->nomeFaixa,
            'artista' => $this->artista,
            'codigoFaixa' => $this->codigoFaixa,
            'album' => $this->album,
            'streams' => $this->streams,
            'minutos' => $this->minutos,
            'imagemUrl' => $this->imagemUrl,
            'urlSpotify' => $this->urlSpotify,
            'musicaUuid' => $this->musicaUuid,
            'artistas' => $this->artistas,
            'fontes' => $this->fontes,
            'porFonte' => $this->porFonte,
            'mashup' => $this->mashup,
            'estimado' => $this->estimado,
            'urlYoutubeMusic' => $this->urlYoutubeMusic,
        ];
    }
}
