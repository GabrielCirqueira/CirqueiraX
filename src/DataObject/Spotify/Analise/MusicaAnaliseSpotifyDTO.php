<?php

declare(strict_types=1);

namespace App\DataObject\Spotify\Analise;

use App\DataObject\Spotify\MapaImagensSpotifyDTO;
use App\Entity\ImagemSpotify;

final readonly class MusicaAnaliseSpotifyDTO
{
    public function __construct(
        public string $nomeFaixa,
        public string $artista,
        public ?string $codigoFaixa,
        public string $album,
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
        $codigo = is_string($linha['codigo_faixa'] ?? null) && '' !== trim($linha['codigo_faixa']) ? trim($linha['codigo_faixa']) : null;
        $album = is_string($linha['album'] ?? null) && '' !== trim($linha['album']) ? $linha['album'] : 'Desconhecido';

        return new self(
            (string) $linha['nome_faixa'],
            (string) $linha['artista'],
            $codigo,
            $album,
            (int) ($linha['streams'] ?? 0),
            (int) round(((int) ($linha['ms'] ?? 0)) / 60000),
        );
    }

    public function chaveImagem(): string
    {
        return ImagemSpotify::gerarChaveFaixa($this->codigoFaixa, $this->artista, $this->nomeFaixa);
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

        return new self(
            $this->nomeFaixa,
            $this->artista,
            $this->codigoFaixa,
            $this->album,
            $this->streams,
            $this->minutos,
            $mapa->obterImagem($chave),
            $mapa->obterUrlSpotify($chave, ImagemSpotify::gerarUrlSpotifyFaixa($this->codigoFaixa, $this->artista, $this->nomeFaixa)),
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
        ];
    }
}
