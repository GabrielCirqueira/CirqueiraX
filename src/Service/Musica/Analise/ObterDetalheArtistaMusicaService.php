<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\DataObject\Musica\AlvoAnaliseMusicaDTO;
use App\DataObject\Spotify\Analise\ArtistaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\ComportamentoReproducaoSpotifyDTO;
use App\DataObject\Spotify\Analise\DetalheArtistaSpotifyDTO;
use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\RepeticaoDiariaSpotifyDTO;
use App\Entity\ArtistaCatalogo;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Exception\Musica\AnaliseMusicaException;
use App\Exception\Musica\MusicaCatalogoException;
use App\Message\BuscarFotoArtistaMessage;
use App\Repository\AnaliseReproducaoMusicalRepository;
use App\Repository\ArtistaCatalogoRepository;
use App\Service\Spotify\AplicarImagensAnaliseSpotifyService;
use App\Service\Spotify\CacheAnaliseSpotifyService;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class ObterDetalheArtistaMusicaService
{
    private const int LIMITE_MUSICAS = 20;
    private const int LIMITE_ALBUNS = 8;
    private const int LIMITE_MASHUPS = 20;
    private const int TAMANHO_TOPO = 5;
    private const int MS_POR_MINUTO = 60000;
    private const int CASAS_PERCENTUAL = 1;

    public function __construct(
        private CacheAnaliseSpotifyService $cacheAnalise,
        private AnaliseReproducaoMusicalRepository $analiseRepository,
        private ArtistaCatalogoRepository $artistaCatalogoRepository,
        private AplicarImagensAnaliseSpotifyService $aplicarImagensService,
        private MessageBusInterface $bus,
    ) {}

    public function executar(Usuario $usuario, FiltroFonteMusica $fonte, string $uuid): DetalheArtistaSpotifyDTO
    {
        $artista = $this->artistaCatalogoRepository->buscarDoUsuario($usuario, $uuid)?->artistaEfetivo();
        if (null === $artista) {
            throw MusicaCatalogoException::artistaNaoEncontrado();
        }

        if ($artista->precisaBuscarFoto()) {
            $this->bus->dispatch(new BuscarFotoArtistaMessage((int) $usuario->getId(), $artista->uuid()->toRfc4122()));
        }

        return $this->cacheAnalise->lembrar(
            $usuario,
            'artista|'.$artista->uuid()->toRfc4122(),
            fn (): DetalheArtistaSpotifyDTO => $this->calcular($usuario, $fonte, $artista),
            $fonte,
        );
    }

    private function calcular(Usuario $usuario, FiltroFonteMusica $fonte, ArtistaCatalogo $catalogo): DetalheArtistaSpotifyDTO
    {
        $alvo = AlvoAnaliseMusicaDTO::doArtista($catalogo->uuid());
        $resumo = $this->analiseRepository->buscarResumoAlvo($usuario, $fonte, $alvo);
        if (null === $resumo) {
            throw AnaliseMusicaException::semReproducoes($catalogo->nome());
        }

        $todos = PeriodoAnaliseSpotifyDTO::todos();
        $musicas = $this->analiseRepository->listarRankingMusicas($usuario, $todos, $fonte, self::LIMITE_MUSICAS, $alvo);
        $mashups = $this->analiseRepository->listarRankingMusicas($usuario, $todos, $fonte, self::LIMITE_MASHUPS, $alvo, null, true);
        $albuns = $this->analiseRepository->listarRankingAlbuns($usuario, $todos, $fonte, self::LIMITE_ALBUNS, $alvo);
        $artista = new ArtistaAnaliseSpotifyDTO(
            nome: $catalogo->nome(),
            codigoArtista: $this->analiseRepository->buscarCodigoSpotifyArtista($usuario, $catalogo->nome()),
            streams: $resumo['streams'],
            minutos: (int) round($resumo['ms'] / self::MS_POR_MINUTO),
            imagemUrl: $catalogo->urlFoto(),
            artistaUuid: $catalogo->uuid()->toRfc4122(),
            fontes: array_keys(array_filter($resumo['porFonte'], static fn (array $valores): bool => null !== $valores['primeira'])),
            porFonte: array_map(static fn (array $valores): array => ['streams' => $valores['streams'], 'minutos' => $valores['minutos']], $resumo['porFonte']),
            estimado: $resumo['minutosEstimados'] > 0,
        );
        $totalMinutos = $this->analiseRepository->calcularTotais($usuario, $todos, $fonte)['minutos'];
        $mapa = $this->aplicarImagensService->mapear($usuario, [...$musicas, ...$mashups, ...$albuns], [$artista]);

        return new DetalheArtistaSpotifyDTO(
            artista: $artista->comImagem($mapa),
            reproducoes: $resumo['reproducoes'],
            faixasDistintas: $resumo['faixas'],
            albunsDistintos: $resumo['albuns'],
            diasOuvidos: $resumo['dias'],
            primeiraVezEm: PeriodoAnaliseSpotifyDTO::utcParaIsoLocal($resumo['primeira']),
            ultimaVezEm: PeriodoAnaliseSpotifyDTO::utcParaIsoLocal($resumo['ultima']),
            posicaoGeral: $this->analiseRepository->buscarPosicaoGeral($usuario, $fonte, $alvo),
            percentualDoTempoTotal: $totalMinutos > 0 ? round(($artista->minutos / $totalMinutos) * 100, self::CASAS_PERCENTUAL) : 0.0,
            evolucao: $this->analiseRepository->calcularEvolucaoMensal($usuario, $todos, $fonte, $alvo),
            mesesNoTopo: $this->analiseRepository->listarMesesNoTopo($usuario, $fonte, $alvo, self::TAMANHO_TOPO),
            topMusicas: $this->aplicarImagensService->aplicar($musicas, $mapa),
            topAlbuns: $this->aplicarImagensService->aplicar($albuns, $mapa),
            maiorRepeticaoDiaria: RepeticaoDiariaSpotifyDTO::deArray(
                $this->analiseRepository->buscarMaiorRepeticaoDiaria($usuario, $todos, $fonte, $alvo),
            ),
            comportamento: ComportamentoReproducaoSpotifyDTO::deArray(
                $this->analiseRepository->calcularComportamento($usuario, $todos, $fonte, $alvo),
            ),
            porFonte: $resumo['porFonte'],
            minutosEstimados: $resumo['minutosEstimados'],
            mashups: $this->aplicarImagensService->aplicar($mashups, $mapa),
        );
    }

}
