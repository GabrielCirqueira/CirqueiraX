<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\Analise\AlbumAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\ArtistaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\MusicaAnaliseSpotifyDTO;
use App\DataObject\Spotify\MapaImagensSpotifyDTO;
use App\Entity\Usuario;

final readonly class AplicarImagensAnaliseSpotifyService
{
    private const int PRIORIDADE_ENRIQUECIMENTO = 2;

    public function __construct(
        private EnriquecerImagensSpotifyService $enriquecerImagensService,
    ) {}

    /**
     * @param list<MusicaAnaliseSpotifyDTO|AlbumAnaliseSpotifyDTO> $itensComFaixa
     * @param list<ArtistaAnaliseSpotifyDTO> $artistas
     */
    public function mapear(Usuario $usuario, array $itensComFaixa, array $artistas): MapaImagensSpotifyDTO
    {
        $itensComFaixa = array_values(array_filter($itensComFaixa, static fn (MusicaAnaliseSpotifyDTO|AlbumAnaliseSpotifyDTO $item): bool => $item->temSpotify()));
        $artistas = array_values(array_filter($artistas, static fn (ArtistaAnaliseSpotifyDTO $item): bool => $item->temSpotify()));

        if ([] === $itensComFaixa && [] === $artistas) {
            return new MapaImagensSpotifyDTO();
        }

        return $this->enriquecerImagensService->enriquecerEAgendar(
            usuario: $usuario,
            faixas: array_map(static fn (MusicaAnaliseSpotifyDTO|AlbumAnaliseSpotifyDTO $item): array => $item->paraEnriquecimento(), $itensComFaixa),
            artistas: array_map(static fn (ArtistaAnaliseSpotifyDTO $item): array => $item->paraEnriquecimento(), $artistas),
            prioridade: self::PRIORIDADE_ENRIQUECIMENTO,
        );
    }

    /**
     * @template T of MusicaAnaliseSpotifyDTO|AlbumAnaliseSpotifyDTO|ArtistaAnaliseSpotifyDTO
     *
     * @param list<T> $itens
     *
     * @return list<T>
     */
    public function aplicar(array $itens, MapaImagensSpotifyDTO $mapa): array
    {
        return array_map(static fn (MusicaAnaliseSpotifyDTO|AlbumAnaliseSpotifyDTO|ArtistaAnaliseSpotifyDTO $item) => $item->comImagem($mapa), $itens);
    }
}
