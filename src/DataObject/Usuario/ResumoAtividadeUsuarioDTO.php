<?php

declare(strict_types=1);

namespace App\DataObject\Usuario;

use App\DataObject\Spotify\Analise\ArtistaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\MusicaAnaliseSpotifyDTO;

final readonly class ResumoAtividadeUsuarioDTO
{
    /**
     * @param array<string, array{total: int, concluidos: int, erros: int, bytes: int, ultimo: ?string}> $midias
     * @param array{total: int, disponiveis: int, erros: int, bytes: int, minutos: int, ultimo: ?string} $audios
     * @param array{total: int, concluidas: int, erros: int, palavras: int, minutos: int, favoritas: int, deVideo: int, ultimo: ?string} $transcricoes
     * @param array{total: int, prontos: int, paginas: int, ultimo: ?string} $livrosAudio
     * @param array{reproducoes: int, videos: int, minutos: int, ultimo: ?string} $youtube
     * @param array{chamadas: int, tokens: int, custoMicrodolares: int} $ia
     * @param array{total: int, faixasTransferidas: int} $transferencias
     * @param array{spotify: ?string, youtubeMusic: ?string, googleFotos: bool} $contas
     * @param array<string, mixed> $musicaTotais
     * @param array<string, mixed> $musicaMes
     * @param array{spotify: int, youtube_music: int, ambas: int} $musicaExclusividade
     * @param list<MusicaAnaliseSpotifyDTO> $topMusicas
     * @param list<ArtistaAnaliseSpotifyDTO> $topArtistas
     */
    public function __construct(
        public array $midias,
        public array $audios,
        public array $transcricoes,
        public array $livrosAudio,
        public array $youtube,
        public array $ia,
        public array $transferencias,
        public array $contas,
        public array $musicaTotais,
        public array $musicaMes,
        public array $musicaExclusividade,
        public array $topMusicas,
        public array $topArtistas,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'midias' => $this->midias,
            'audios' => $this->audios,
            'transcricoes' => $this->transcricoes,
            'livrosAudio' => $this->livrosAudio,
            'youtube' => $this->youtube,
            'ia' => $this->ia,
            'transferencias' => $this->transferencias,
            'contas' => $this->contas,
            'musica' => [
                'totais' => $this->musicaTotais,
                'mes' => $this->musicaMes,
                'exclusividade' => $this->musicaExclusividade,
                'topMusicas' => array_map(static fn (MusicaAnaliseSpotifyDTO $musica): array => $musica->paraArray(), $this->topMusicas),
                'topArtistas' => array_map(static fn (ArtistaAnaliseSpotifyDTO $artista): array => $artista->paraArray(), $this->topArtistas),
            ],
        ];
    }
}
