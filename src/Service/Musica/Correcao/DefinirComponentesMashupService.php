<?php

declare(strict_types=1);

namespace App\Service\Musica\Correcao;

use App\DataObject\Musica\ComponenteMashupEntradaDTO;
use App\DataObject\Musica\DefinirComponentesMashupDTO;
use App\Entity\ArtistaCatalogo;
use App\Entity\MusicaCatalogo;
use App\Entity\Usuario;
use App\Exception\Musica\MusicaCatalogoException;
use App\Repository\MusicaCatalogoRepository;
use App\Service\Musica\NormalizarTextoMusicaService;
use App\Service\Musica\ObterMusicaCatalogoService;
use App\Service\Spotify\CacheAnaliseSpotifyService;

final readonly class DefinirComponentesMashupService
{
    private const string SEPARADOR_TITULO = ' + ';

    public function __construct(
        private MusicaCatalogoRepository $musicaRepository,
        private ObterMusicaCatalogoService $obterMusica,
        private NormalizarTextoMusicaService $normalizador,
        private CacheAnaliseSpotifyService $cacheAnalise,
    ) {
    }

    public function executar(Usuario $usuario, string $mashupUuid, DefinirComponentesMashupDTO $dto): MusicaCatalogo
    {
        $mashup = $this->musicaRepository->buscarDoUsuario($usuario, $mashupUuid) ?? throw MusicaCatalogoException::musicaNaoEncontrada();
        if (!$mashup->isMashup()) {
            throw MusicaCatalogoException::naoEhMashup();
        }

        $componentes = array_map(fn (ComponenteMashupEntradaDTO $componente): array => [
            'texto' => trim($componente->titulo),
            'musica' => $this->obterMusica->obterMusica($usuario, $componente->titulo, $componente->artistas),
        ], $dto->componentes);

        $chave = $this->normalizador->chaveMashup(array_map(static fn (array $componente): string => $componente['musica']->chaveNormalizada(), $componentes));
        $existente = $this->musicaRepository->buscarPorChave($usuario, $chave);
        if (null !== $existente && $existente !== $mashup) {
            throw MusicaCatalogoException::mashupJaExiste();
        }

        $titulo = implode(self::SEPARADOR_TITULO, array_map(static fn (array $componente): string => $componente['musica']->titulo(), $componentes));
        $artistas = [];
        foreach ($componentes as $componente) {
            foreach ($componente['musica']->artistas() as $artista) {
                $artistas[$artista->uuid()->toRfc4122()] = $artista;
            }
        }

        $mashup->definirComponentes($componentes, $chave, $titulo)
            ->definirArtistas(array_values(array_map(static fn (ArtistaCatalogo $artista): ArtistaCatalogo => $artista->artistaEfetivo(), $artistas)))
            ->confirmarManualmente();
        $this->musicaRepository->flush();
        $this->cacheAnalise->invalidar($usuario);

        return $mashup;
    }
}
