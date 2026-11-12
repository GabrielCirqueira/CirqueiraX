<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\Entity\ArtistaCatalogo;
use App\Entity\ComponenteMashup;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Exception\Musica\MusicaCatalogoException;
use App\Repository\AnaliseReproducaoMusicalRepository;
use App\Repository\MusicaCatalogoRepository;

final readonly class ListarVersoesMusicaService
{
    public function __construct(
        private MusicaCatalogoRepository $musicaCatalogoRepository,
        private AnaliseReproducaoMusicalRepository $analiseRepository,
        private CompletarCapasVariantesService $completarCapas,
    ) {
    }

    /**
     * @return array{mashup: bool, variantes: list<array<string, mixed>>, componentes: list<array<string, mixed>>, artistas: list<string>}
     */
    public function executar(Usuario $usuario, FiltroFonteMusica $fonte, string $uuid, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        $musica = $this->musicaCatalogoRepository->buscarDoUsuario($usuario, $uuid)?->musicaEfetiva()
            ?? throw MusicaCatalogoException::musicaNaoEncontrada();

        return [
            'mashup' => $musica->isMashup(),
            'variantes' => $this->completarCapas->executar($usuario, $this->analiseRepository->listarVariantesMusica($usuario, $fonte, $musica->uuid(), $periodo)),
            'componentes' => array_map(static fn (ComponenteMashup $componente): array => [
                'texto' => $componente->texto(),
                'musicaUuid' => $componente->musicaComponente()?->musicaEfetiva()->uuid()->toRfc4122(),
                'titulo' => $componente->musicaComponente()?->musicaEfetiva()->titulo(),
            ], $musica->componentes()),
            'artistas' => array_map(static fn (ArtistaCatalogo $artista): string => $artista->artistaEfetivo()->nome(), $musica->artistas()),
        ];
    }
}
