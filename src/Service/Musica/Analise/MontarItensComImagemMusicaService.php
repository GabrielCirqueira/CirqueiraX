<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\DataObject\Spotify\Analise\ArtistaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\MusicaAnaliseSpotifyDTO;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Repository\AnaliseReproducaoMusicalRepository;
use App\Service\Spotify\AplicarImagensAnaliseSpotifyService;

final readonly class MontarItensComImagemMusicaService
{
    public function __construct(
        private AnaliseReproducaoMusicalRepository $analiseRepository,
        private AplicarImagensAnaliseSpotifyService $aplicarImagensService,
    ) {}

    /**
     * @param list<string> $uuidsMusicas
     * @param list<string> $uuidsArtistas
     *
     * @return array{musicas: array<string, array<string, mixed>>, artistas: array<string, array<string, mixed>>}
     */
    public function montar(Usuario $usuario, FiltroFonteMusica $fonte, array $uuidsMusicas, array $uuidsArtistas = []): array
    {
        $musicas = array_values($this->analiseRepository->mapearMusicasPorUuid($usuario, $fonte, $uuidsMusicas));
        $artistas = array_values($this->analiseRepository->mapearArtistasPorUuid($usuario, $fonte, $uuidsArtistas));
        $mapa = $this->aplicarImagensService->mapear($usuario, $musicas, $artistas);

        $musicasComImagem = [];
        foreach ($this->aplicarImagensService->aplicar($musicas, $mapa) as $musica) {
            $musicasComImagem[(string) $musica->musicaUuid] = $musica->paraArray();
        }

        $artistasComImagem = [];
        foreach ($this->aplicarImagensService->aplicar($artistas, $mapa) as $artista) {
            $artistasComImagem[(string) $artista->artistaUuid] = $artista->paraArray();
        }

        return ['musicas' => $musicasComImagem, 'artistas' => $artistasComImagem];
    }

    /**
     * @param list<MusicaAnaliseSpotifyDTO> $musicas
     * @param list<ArtistaAnaliseSpotifyDTO> $artistas
     *
     * @return array{musicas: list<array<string, mixed>>, artistas: list<array<string, mixed>>}
     */
    public function aplicarEmListas(Usuario $usuario, array $musicas, array $artistas = []): array
    {
        $mapa = $this->aplicarImagensService->mapear($usuario, $musicas, $artistas);

        return [
            'musicas' => array_map(static fn (MusicaAnaliseSpotifyDTO $musica): array => $musica->paraArray(), $this->aplicarImagensService->aplicar($musicas, $mapa)),
            'artistas' => array_map(static fn (ArtistaAnaliseSpotifyDTO $artista): array => $artista->paraArray(), $this->aplicarImagensService->aplicar($artistas, $mapa)),
        ];
    }
}
