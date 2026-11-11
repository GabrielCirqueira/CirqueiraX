<?php

declare(strict_types=1);

namespace App\Service\Musica\Correcao;

use App\DataObject\Musica\UnirArtistasDTO;
use App\Entity\AliasArtistaCatalogo;
use App\Entity\ArtistaCatalogo;
use App\Entity\Usuario;
use App\Exception\Musica\MusicaCatalogoException;
use App\Repository\AliasArtistaCatalogoRepository;
use App\Repository\ArtistaCatalogoRepository;
use App\Service\Spotify\CacheAnaliseSpotifyService;

final readonly class UnirArtistasCatalogoService
{
    public function __construct(
        private ArtistaCatalogoRepository $artistaRepository,
        private AliasArtistaCatalogoRepository $aliasRepository,
        private CacheAnaliseSpotifyService $cacheAnalise,
    ) {
    }

    public function executar(Usuario $usuario, UnirArtistasDTO $dto): ArtistaCatalogo
    {
        $origem = $this->artistaRepository->buscarDoUsuario($usuario, $dto->origemUuid) ?? throw MusicaCatalogoException::artistaNaoEncontrado();
        $destino = ($this->artistaRepository->buscarDoUsuario($usuario, $dto->destinoUuid) ?? throw MusicaCatalogoException::artistaNaoEncontrado())->artistaEfetivo();

        if ($origem === $destino) {
            throw MusicaCatalogoException::uniaoComElaMesma();
        }

        $origem->unirA($destino);
        if (null === $this->aliasRepository->buscarPorAlias($usuario, $origem->nomeNormalizado())) {
            $this->aliasRepository->salvar(new AliasArtistaCatalogo($destino, $origem->nomeNormalizado()), flush: false);
        }
        $this->artistaRepository->flush();
        $this->cacheAnalise->invalidar($usuario);

        return $destino;
    }
}
