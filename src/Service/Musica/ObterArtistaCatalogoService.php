<?php

declare(strict_types=1);

namespace App\Service\Musica;

use App\Entity\ArtistaCatalogo;
use App\Entity\Usuario;
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

    public function executar(Usuario $usuario, string $nome): ArtistaCatalogo
    {
        $normalizado = $this->normalizador->normalizar($nome);

        $alias = $this->aliasRepository->buscarPorAlias($usuario, $normalizado);
        if (null !== $alias) {
            return $alias->artista()->artistaEfetivo();
        }

        $artista = $this->artistaRepository->buscarPorNomeNormalizado($usuario, $normalizado);
        if (null !== $artista) {
            return $artista->artistaEfetivo();
        }

        $artista = new ArtistaCatalogo($usuario, trim($nome), $normalizado);
        $this->artistaRepository->salvar($artista);

        return $artista;
    }
}
