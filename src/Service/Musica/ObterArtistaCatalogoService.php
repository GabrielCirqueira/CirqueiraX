<?php

declare(strict_types=1);

namespace App\Service\Musica;

use App\Entity\ArtistaCatalogo;
use App\Repository\AliasArtistaCatalogoRepository;
use App\Repository\ArtistaCatalogoRepository;

final readonly class ObterArtistaCatalogoService
{
    public function __construct(
        private ArtistaCatalogoRepository $artistaRepository,
        private AliasArtistaCatalogoRepository $aliasRepository,
        private NormalizarTextoMusicaService $normalizador,
    ) {
    }

    public function executar(string $nome): ArtistaCatalogo
    {
        $normalizado = $this->normalizador->normalizar($nome);

        $alias = $this->aliasRepository->buscarPorAlias($normalizado);
        if (null !== $alias) {
            return $alias->artista()->artistaEfetivo();
        }

        $artista = $this->artistaRepository->buscarPorNomeNormalizado($normalizado);
        if (null !== $artista) {
            return $artista->artistaEfetivo();
        }

        $artista = new ArtistaCatalogo(trim($nome), $normalizado);
        $this->artistaRepository->salvar($artista);

        return $artista;
    }
}
