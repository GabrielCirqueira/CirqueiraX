<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\DataObject\Musica\AlvoAnaliseMusicaDTO;
use App\DataObject\Spotify\Analise\MusicaAnaliseSpotifyDTO;
use App\DataObject\Spotify\ItemTopMusicaArtistaDTO;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Exception\Musica\MusicaCatalogoException;
use App\Repository\AnaliseReproducaoMusicalRepository;
use App\Repository\ArtistaCatalogoRepository;
use App\Service\Spotify\AplicarImagensAnaliseSpotifyService;

final readonly class ObterTopMusicasArtistaService
{
    public const int LIMITE_PADRAO = 5;
    private const int LIMITE_MAXIMO = 500;

    public function __construct(
        private AnaliseReproducaoMusicalRepository $analiseRepository,
        private ArtistaCatalogoRepository $artistaRepository,
        private AplicarImagensAnaliseSpotifyService $aplicarImagensService,
        private ResolverPeriodoAnaliseMusicaService $resolverPeriodoService,
    ) {}

    /**
     * @return list<ItemTopMusicaArtistaDTO>
     */
    public function executar(
        Usuario $usuario,
        FiltroFonteMusica $fonte,
        string $artistaUuid,
        ?string $album = null,
        ?string $tipo = null,
        ?int $dias = null,
        ?int $ano = null,
        ?int $mes = null,
        ?string $inicio = null,
        ?string $fim = null,
        int $limite = self::LIMITE_PADRAO,
    ): array {
        $artista = $this->artistaRepository->buscarDoUsuario($usuario, $artistaUuid)?->artistaEfetivo()
            ?? throw MusicaCatalogoException::artistaNaoEncontrado();
        $periodo = $this->resolverPeriodoService->executar($tipo, $dias, $ano, $mes, $inicio, $fim);

        $musicas = $this->analiseRepository->listarRankingMusicas(
            $usuario,
            $periodo,
            $fonte,
            max(1, min(self::LIMITE_MAXIMO, $limite)),
            AlvoAnaliseMusicaDTO::doArtista($artista->uuid()),
            null !== $album && '' !== trim($album) ? trim($album) : null,
        );
        $mapa = $this->aplicarImagensService->mapear($usuario, $musicas, []);

        return array_map(
            static fn (MusicaAnaliseSpotifyDTO $musica): ItemTopMusicaArtistaDTO => ItemTopMusicaArtistaDTO::daAnalise($musica),
            $this->aplicarImagensService->aplicar($musicas, $mapa),
        );
    }
}
