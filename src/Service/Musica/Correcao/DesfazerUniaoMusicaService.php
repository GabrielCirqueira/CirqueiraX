<?php

declare(strict_types=1);

namespace App\Service\Musica\Correcao;

use App\Entity\MusicaCatalogo;
use App\Entity\Usuario;
use App\Exception\Musica\MusicaCatalogoException;
use App\Repository\MusicaCatalogoRepository;
use App\Service\Spotify\CacheAnaliseSpotifyService;

final readonly class DesfazerUniaoMusicaService
{
    public function __construct(
        private MusicaCatalogoRepository $musicaRepository,
        private CacheAnaliseSpotifyService $cacheAnalise,
    ) {
    }

    public function executar(Usuario $usuario, string $musicaUuid): MusicaCatalogo
    {
        $musica = $this->musicaRepository->buscarDoUsuario($usuario, $musicaUuid) ?? throw MusicaCatalogoException::musicaNaoEncontrada();
        if (null === $musica->unidaA()) {
            throw MusicaCatalogoException::musicaNaoUnida();
        }

        $musica->desfazerUniao()->confirmarManualmente();
        $this->musicaRepository->flush();
        $this->cacheAnalise->invalidar($usuario);

        return $musica;
    }
}
