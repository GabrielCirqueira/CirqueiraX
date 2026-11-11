<?php

declare(strict_types=1);

namespace App\Service\Musica\Correcao;

use App\DataObject\Musica\DefinirArtistasMusicaDTO;
use App\Entity\MusicaCatalogo;
use App\Entity\Usuario;
use App\Exception\Musica\MusicaCatalogoException;
use App\Repository\MusicaCatalogoRepository;
use App\Service\Musica\ObterArtistaCatalogoService;
use App\Service\Spotify\CacheAnaliseSpotifyService;

final readonly class DefinirArtistasMusicaService
{
    public function __construct(
        private MusicaCatalogoRepository $musicaRepository,
        private ObterArtistaCatalogoService $obterArtista,
        private CacheAnaliseSpotifyService $cacheAnalise,
    ) {
    }

    public function executar(Usuario $usuario, string $musicaUuid, DefinirArtistasMusicaDTO $dto): MusicaCatalogo
    {
        $musica = $this->musicaRepository->buscarDoUsuario($usuario, $musicaUuid) ?? throw MusicaCatalogoException::musicaNaoEncontrada();

        $musica->definirArtistas(array_map(fn (string $nome) => $this->obterArtista->executar($usuario, $nome), $dto->artistas))->confirmarManualmente();
        $this->musicaRepository->flush();
        $this->cacheAnalise->invalidar($usuario);

        return $musica;
    }
}
