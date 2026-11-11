<?php

declare(strict_types=1);

namespace App\Service\Musica\Correcao;

use App\DataObject\Musica\BuscaCatalogoMusicaDTO;
use App\Entity\ArtistaCatalogo;
use App\Entity\MusicaCatalogo;
use App\Entity\Usuario;
use App\Repository\ArtistaCatalogoRepository;
use App\Repository\MusicaCatalogoRepository;
use App\Serializer\MusicaCatalogoSerializer;
use App\Service\Musica\NormalizarTextoMusicaService;

final readonly class BuscarCatalogoMusicaService
{
    public function __construct(
        private MusicaCatalogoRepository $musicaRepository,
        private ArtistaCatalogoRepository $artistaRepository,
        private NormalizarTextoMusicaService $normalizador,
        private MusicaCatalogoSerializer $serializer,
    ) {
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function buscarMusicas(Usuario $usuario, BuscaCatalogoMusicaDTO $dto): array
    {
        $termo = $this->normalizador->normalizar($dto->busca);
        if ('' === $termo) {
            return [];
        }

        return array_map(
            fn (MusicaCatalogo $musica): array => $this->serializer->serializarMusica($musica),
            $this->musicaRepository->buscarPorTexto($usuario, $termo, $dto->limite),
        );
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function buscarArtistas(Usuario $usuario, BuscaCatalogoMusicaDTO $dto): array
    {
        $termo = $this->normalizador->normalizar($dto->busca);
        if ('' === $termo) {
            return [];
        }

        return array_map(
            fn (ArtistaCatalogo $artista): array => $this->serializer->serializarArtista($artista),
            $this->artistaRepository->buscarPorTexto($usuario, $termo, $dto->limite),
        );
    }
}
