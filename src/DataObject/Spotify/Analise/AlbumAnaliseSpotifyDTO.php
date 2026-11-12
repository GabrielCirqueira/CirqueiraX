<?php

declare(strict_types=1);

namespace App\DataObject\Spotify\Analise;

use App\DataObject\Spotify\MapaImagensSpotifyDTO;
use App\Entity\ImagemSpotify;

final readonly class AlbumAnaliseSpotifyDTO
{
    /**
     * @param list<string>                                     $fontes
     * @param array<string, array{streams: int, minutos: int}> $porFonte
     */
    public function __construct(
        public string $album,
        public string $artista,
        public int $streams,
        public int $minutos,
        public int $faixasDistintas,
        public string $faixaReferencia,
        public ?string $codigoFaixaReferencia,
        public ?string $imagemUrl = null,
        public ?string $urlSpotify = null,
        public ?string $musicaReferenciaUuid = null,
        public array $fontes = [],
        public array $porFonte = [],
    ) {
    }

    /**
     * @param array<string, mixed> $linha
     */
    public static function daLinha(array $linha): self
    {
        $codigo = is_string($linha['codigo_faixa'] ?? null) && '' !== trim($linha['codigo_faixa']) ? trim($linha['codigo_faixa']) : null;
        /** @var list<string> $fontes */
        $fontes = $linha['fontes'] ?? [];
        /** @var array<string, array{streams: int, minutos: int}> $porFonte */
        $porFonte = $linha['por_fonte'] ?? [];

        return new self(
            (string) $linha['album'],
            (string) $linha['artista'],
            (int) ($linha['total_streams'] ?? 0),
            (int) round(((int) ($linha['total_ms'] ?? 0)) / 60000),
            (int) ($linha['faixas_distintas'] ?? 0),
            (string) $linha['nome_faixa'],
            $codigo,
            is_string($linha['url_capa'] ?? null) ? $linha['url_capa'] : null,
            null,
            is_string($linha['musica_uuid'] ?? null) ? $linha['musica_uuid'] : null,
            $fontes,
            $porFonte,
        );
    }

    public function temSpotify(): bool
    {
        return null !== $this->codigoFaixaReferencia || null === $this->musicaReferenciaUuid;
    }

    public function chaveImagem(): string
    {
        return ImagemSpotify::gerarChaveFaixa($this->codigoFaixaReferencia, $this->artista, $this->faixaReferencia);
    }

    /**
     * @return array{codigo: ?string, nome: string, artista: string}
     */
    public function paraEnriquecimento(): array
    {
        return ['codigo' => $this->codigoFaixaReferencia, 'nome' => $this->faixaReferencia, 'artista' => $this->artista];
    }

    public function comImagem(MapaImagensSpotifyDTO $mapa): self
    {
        $chave = $this->chaveImagem();

        return new self(
            $this->album,
            $this->artista,
            $this->streams,
            $this->minutos,
            $this->faixasDistintas,
            $this->faixaReferencia,
            $this->codigoFaixaReferencia,
            $mapa->obterImagem($chave) ?? $this->imagemUrl,
            $this->temSpotify()
                ? $mapa->obterUrlSpotify($chave, ImagemSpotify::gerarUrlSpotifyFaixa($this->codigoFaixaReferencia, $this->artista, $this->faixaReferencia))
                : null,
            $this->musicaReferenciaUuid,
            $this->fontes,
            $this->porFonte,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'album' => $this->album,
            'artista' => $this->artista,
            'streams' => $this->streams,
            'minutos' => $this->minutos,
            'faixasDistintas' => $this->faixasDistintas,
            'faixaReferencia' => $this->faixaReferencia,
            'codigoFaixaReferencia' => $this->codigoFaixaReferencia,
            'imagemUrl' => $this->imagemUrl,
            'urlSpotify' => $this->urlSpotify,
            'musicaReferenciaUuid' => $this->musicaReferenciaUuid,
            'fontes' => $this->fontes,
            'porFonte' => $this->porFonte,
        ];
    }
}
