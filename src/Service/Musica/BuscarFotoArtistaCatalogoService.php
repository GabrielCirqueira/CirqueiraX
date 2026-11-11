<?php

declare(strict_types=1);

namespace App\Service\Musica;

use App\Entity\ImagemSpotify;
use App\Entity\Usuario;
use App\Exception\YoutubeMusic\YoutubeMusicException;
use App\Interface\YoutubeMusicInterface;
use App\Repository\AnaliseReproducaoMusicalRepository;
use App\Repository\ArtistaCatalogoRepository;
use App\Repository\ImagemSpotifyRepository;

final readonly class BuscarFotoArtistaCatalogoService
{
    public function __construct(
        private ArtistaCatalogoRepository $artistaRepository,
        private ImagemSpotifyRepository $imagemRepository,
        private AnaliseReproducaoMusicalRepository $analiseRepository,
        private YoutubeMusicInterface $youtubeMusic,
    ) {}

    public function executar(Usuario $usuario, string $artistaUuid): void
    {
        $artista = $this->artistaRepository->buscarDoUsuario($usuario, $artistaUuid)?->artistaEfetivo();
        if (null === $artista || !$artista->precisaBuscarFoto()) {
            return;
        }

        $codigo = $this->analiseRepository->buscarCodigoSpotifyArtista($usuario, $artista->nome());
        $urlFoto = $this->imagemRepository->buscarPorChaveBusca(ImagemSpotify::gerarChaveArtista($codigo, $artista->nome()))?->primeiraImagemUrl();

        try {
            $urlFoto ??= $this->youtubeMusic->buscarFotoArtista($artista->nome());
        } catch (YoutubeMusicException $falha) {
            if ($falha->isServicoIndisponivel()) {
                throw $falha;
            }
        }

        $this->artistaRepository->salvar($artista->registrarBuscaFoto($urlFoto));
    }
}
