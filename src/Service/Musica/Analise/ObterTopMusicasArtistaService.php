<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\DataObject\Musica\AlvoAnaliseMusicaDTO;
use App\DataObject\Spotify\Analise\MusicaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
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
    private const string TIPO_TODOS = 'todos';
    private const string TIPO_MES = 'mes';

    public function __construct(
        private AnaliseReproducaoMusicalRepository $analiseRepository,
        private ArtistaCatalogoRepository $artistaRepository,
        private AplicarImagensAnaliseSpotifyService $aplicarImagensService,
        private ObterResumoIntervaloPersonalizadoService $obterResumoIntervaloService,
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
        $tipoFinal = $tipo ?? (null !== $ano && null !== $mes ? self::TIPO_MES : self::TIPO_TODOS);
        $periodo = $this->resolverPeriodo($tipoFinal, $dias, $ano, $mes, $inicio, $fim);

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

    private function resolverPeriodo(string $tipo, ?int $dias, ?int $ano, ?int $mes, ?string $inicio, ?string $fim): PeriodoAnaliseSpotifyDTO
    {
        if (self::TIPO_TODOS === $tipo) {
            return PeriodoAnaliseSpotifyDTO::todos();
        }

        [$inicioLocal, $fimLocal, , , $rotulo] = $this->obterResumoIntervaloService->resolverIntervalo($tipo, $dias, $ano, $mes, $inicio, $fim);

        return PeriodoAnaliseSpotifyDTO::entre($inicioLocal, $fimLocal, $rotulo);
    }
}
