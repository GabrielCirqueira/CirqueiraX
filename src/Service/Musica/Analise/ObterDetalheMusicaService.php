<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\DataObject\Musica\AlvoAnaliseMusicaDTO;
use App\DataObject\Spotify\Analise\ArtistaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\ComportamentoReproducaoSpotifyDTO;
use App\DataObject\Spotify\Analise\DetalheMusicaSpotifyDTO;
use App\DataObject\Spotify\Analise\MusicaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\RepeticaoDiariaSpotifyDTO;
use App\Entity\ComponenteMashup;
use App\Entity\MusicaCatalogo;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Exception\Musica\AnaliseMusicaException;
use App\Exception\Musica\MusicaCatalogoException;
use App\Repository\AnaliseReproducaoMusicalRepository;
use App\Repository\MusicaCatalogoRepository;
use App\Service\Spotify\AplicarImagensAnaliseSpotifyService;
use App\Service\Spotify\CacheAnaliseSpotifyService;

final readonly class ObterDetalheMusicaService
{
    private const int LIMITE_OUTRAS = 6;
    private const int TAMANHO_TOPO = 5;
    private const int MS_POR_MINUTO = 60000;

    public function __construct(
        private CacheAnaliseSpotifyService $cacheAnalise,
        private AnaliseReproducaoMusicalRepository $analiseRepository,
        private MusicaCatalogoRepository $musicaCatalogoRepository,
        private AplicarImagensAnaliseSpotifyService $aplicarImagensService,
    ) {}

    public function executar(Usuario $usuario, FiltroFonteMusica $fonte, string $uuid): DetalheMusicaSpotifyDTO
    {
        $musica = $this->musicaCatalogoRepository->buscarDoUsuario($usuario, $uuid)?->musicaEfetiva();
        if (null === $musica) {
            throw MusicaCatalogoException::musicaNaoEncontrada();
        }

        return $this->cacheAnalise->lembrar(
            $usuario,
            'musica|'.$musica->uuid()->toRfc4122(),
            fn (): DetalheMusicaSpotifyDTO => $this->calcular($usuario, $fonte, $musica),
            $fonte,
        );
    }

    private function calcular(Usuario $usuario, FiltroFonteMusica $fonte, MusicaCatalogo $catalogo): DetalheMusicaSpotifyDTO
    {
        $alvo = AlvoAnaliseMusicaDTO::daMusica($catalogo->uuid());
        $resumo = $this->analiseRepository->buscarResumoAlvo($usuario, $fonte, $alvo);
        if (null === $resumo) {
            throw AnaliseMusicaException::semReproducoes($catalogo->titulo());
        }

        $todos = PeriodoAnaliseSpotifyDTO::todos();
        $musica = $this->analiseRepository->listarRankingMusicas($usuario, $todos, $fonte, 1, $alvo)[0]
            ?? throw AnaliseMusicaException::semReproducoes($catalogo->titulo());
        $artista = $this->buscarArtistaPrincipal($usuario, $fonte, $catalogo);
        $outras = null === $artista ? [] : $this->listarOutrasDoArtista($usuario, $fonte, $artista, $catalogo);
        $mapa = $this->aplicarImagensService->mapear($usuario, [$musica, ...$outras], array_values(array_filter([$artista])));

        return new DetalheMusicaSpotifyDTO(
            musica: $musica->comImagem($mapa),
            artista: $artista?->comImagem($mapa) ?? new ArtistaAnaliseSpotifyDTO($musica->artista, null, 0, 0),
            reproducoes: $resumo['reproducoes'],
            diasOuvidos: $resumo['dias'],
            primeiraVezEm: PeriodoAnaliseSpotifyDTO::utcParaIsoLocal($resumo['primeira']),
            ultimaVezEm: PeriodoAnaliseSpotifyDTO::utcParaIsoLocal($resumo['ultima']),
            posicaoGeral: $this->analiseRepository->buscarPosicaoGeral($usuario, $fonte, $alvo),
            duracaoMs: $this->analiseRepository->buscarDuracaoMusica($usuario, $catalogo->uuid()),
            evolucao: $this->analiseRepository->calcularEvolucaoMensal($usuario, $todos, $fonte, $alvo),
            mesesNoTopo: $this->analiseRepository->listarMesesNoTopo($usuario, $fonte, $alvo, self::TAMANHO_TOPO),
            recordeDiario: RepeticaoDiariaSpotifyDTO::deArray(
                $this->analiseRepository->buscarMaiorRepeticaoDiaria($usuario, $todos, $fonte, $alvo),
            ),
            comportamento: ComportamentoReproducaoSpotifyDTO::deArray(
                $this->analiseRepository->calcularComportamento($usuario, $todos, $fonte, $alvo),
            ),
            outrasDoArtista: $this->aplicarImagensService->aplicar($outras, $mapa),
            porFonte: $resumo['porFonte'],
            minutosEstimados: $resumo['minutosEstimados'],
            variantes: $this->analiseRepository->listarVariantesMusica($usuario, $fonte, $catalogo->uuid()),
            componentes: array_map(static fn (ComponenteMashup $componente): array => [
                'texto' => $componente->texto(),
                'musicaUuid' => $componente->musicaComponente()?->musicaEfetiva()->uuid()->toRfc4122(),
                'titulo' => $componente->musicaComponente()?->musicaEfetiva()->titulo(),
            ], $catalogo->componentes()),
        );
    }

    private function buscarArtistaPrincipal(Usuario $usuario, FiltroFonteMusica $fonte, MusicaCatalogo $catalogo): ?ArtistaAnaliseSpotifyDTO
    {
        $principal = $catalogo->artistas()[0] ?? null;
        if (null === $principal) {
            return null;
        }

        $resumo = $this->analiseRepository->buscarResumoAlvo($usuario, $fonte, AlvoAnaliseMusicaDTO::doArtista($principal->artistaEfetivo()->uuid()));

        return new ArtistaAnaliseSpotifyDTO(
            nome: $principal->artistaEfetivo()->nome(),
            codigoArtista: $this->analiseRepository->buscarCodigoSpotifyArtista($usuario, $principal->artistaEfetivo()->nome()),
            streams: $resumo['streams'] ?? 0,
            minutos: (int) round(($resumo['ms'] ?? 0) / self::MS_POR_MINUTO),
            imagemUrl: $principal->artistaEfetivo()->urlFoto(),
            artistaUuid: $principal->artistaEfetivo()->uuid()->toRfc4122(),
        );
    }

    /**
     * @return list<MusicaAnaliseSpotifyDTO>
     */
    private function listarOutrasDoArtista(Usuario $usuario, FiltroFonteMusica $fonte, ArtistaAnaliseSpotifyDTO $artista, MusicaCatalogo $catalogo): array
    {
        $alvoArtista = AlvoAnaliseMusicaDTO::doArtista($catalogo->artistas()[0]->artistaEfetivo()->uuid());
        $outras = array_filter(
            $this->analiseRepository->listarRankingMusicas($usuario, PeriodoAnaliseSpotifyDTO::todos(), $fonte, self::LIMITE_OUTRAS + 1, $alvoArtista),
            static fn (MusicaAnaliseSpotifyDTO $item): bool => $item->musicaUuid !== $catalogo->uuid()->toRfc4122(),
        );

        return array_slice(array_values($outras), 0, self::LIMITE_OUTRAS);
    }
}
