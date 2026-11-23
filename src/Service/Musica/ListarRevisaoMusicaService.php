<?php

declare(strict_types=1);

namespace App\Service\Musica;

use App\DataObject\Musica\FiltroRevisaoMusicaDTO;
use App\Entity\ImagemSpotify;
use App\Entity\MusicaCatalogo;
use App\Entity\Usuario;
use App\Entity\VideoYoutube;
use App\Enum\TipoRevisaoMusica;
use App\Repository\MusicaCatalogoRepository;
use App\Repository\RegraCanalYoutubeRepository;
use App\Repository\ReproducaoMusicalRepository;
use App\Repository\VideoYoutubeRepository;
use App\Serializer\MusicaCatalogoSerializer;
use App\Service\Spotify\EnriquecerImagensSpotifyService;

final readonly class ListarRevisaoMusicaService
{
    private const int PRIORIDADE_IMAGENS = 2;
    private const int MINIMO_VIDEOS_CANAL = 2;
    private const int MINIMO_VIDEOS_CANAL_UNICO = 1;

    public function __construct(
        private VideoYoutubeRepository $videoRepository,
        private MusicaCatalogoRepository $musicaRepository,
        private RegraCanalYoutubeRepository $regraRepository,
        private SugerirDuplicatasCatalogoService $sugerirDuplicatas,
        private NormalizarTextoMusicaService $normalizador,
        private MusicaCatalogoSerializer $serializer,
        private ReproducaoMusicalRepository $reproducaoRepository,
        private EnriquecerImagensSpotifyService $enriquecerImagens,
        private MontarMidiaSugestoesRevisaoService $montarMidiaSugestoes,
    ) {
    }

    /**
     * @return array{tipo: string, itens: list<array<string, mixed>>, total: int, pagina: int, porPagina: int}
     */
    public function executar(Usuario $usuario, FiltroRevisaoMusicaDTO $filtro): array
    {
        [$itens, $total] = match ($filtro->tipo) {
            TipoRevisaoMusica::CanalNovo => $this->listarCanais($usuario, $filtro),
            TipoRevisaoMusica::PossivelDuplicata => $this->listarDuplicatas($usuario, $filtro),
            default => $this->listarVideos($usuario, $filtro),
        };

        return ['tipo' => $filtro->tipo->value, 'itens' => $itens, 'total' => $total, 'pagina' => $filtro->pagina, 'porPagina' => $filtro->porPagina];
    }

    /**
     * @return array<string, int>
     */
    public function contar(Usuario $usuario): array
    {
        $contagens = [];
        foreach (TipoRevisaoMusica::cases() as $tipo) {
            $contagens[$tipo->value] = match ($tipo) {
                TipoRevisaoMusica::CanalNovo => count($this->filtrarCanaisSemRegra($usuario, self::MINIMO_VIDEOS_CANAL)),
                TipoRevisaoMusica::PossivelDuplicata => count($this->sugerirDuplicatas->executar($usuario)),
                default => $this->videoRepository->contarParaRevisao($usuario, $tipo),
            };
        }

        return $contagens;
    }

    /**
     * @return array{0: list<array<string, mixed>>, 1: int}
     */
    private function listarVideos(Usuario $usuario, FiltroRevisaoMusicaDTO $filtro): array
    {
        $pagina = $this->videoRepository->listarParaRevisao($usuario, $filtro);
        $videos = $this->videoRepository->buscarPorUuidsOrdenados($usuario, $pagina['uuids']);
        $midias = $this->montarMidiaSugestoes->executar($usuario, $videos);

        return [array_map(fn (VideoYoutube $video): array => [
            ...$this->serializer->serializarVideo($video),
            'midiaSugestoes' => $midias[$video->uuid()->toRfc4122()] ?? [],
        ], $videos), $pagina['total']];
    }

    /**
     * @return array{0: list<array<string, mixed>>, 1: int}
     */
    private function listarCanais(Usuario $usuario, FiltroRevisaoMusicaDTO $filtro): array
    {
        $canais = $this->filtrarCanaisSemRegra($usuario, $filtro->incluirCanaisUnicos ? self::MINIMO_VIDEOS_CANAL_UNICO : self::MINIMO_VIDEOS_CANAL);
        $busca = $filtro->buscaNormalizada();
        if (null !== $busca) {
            $canais = array_values(array_filter($canais, static fn (array $canal): bool => false !== mb_stripos($canal['canal'] . ' ' . $canal['exemplo'], $busca)));
        }

        return [array_slice($canais, $filtro->deslocamento(), $filtro->porPagina), count($canais)];
    }

    /**
     * @return list<array{canal: string, canalId: string|null, total: int, exemplo: string, exemploVideoId: string|null}>
     */
    private function filtrarCanaisSemRegra(Usuario $usuario, int $minimoVideos): array
    {
        $comRegra = $this->regraRepository->listarCanaisComRegra($usuario);

        return array_values(array_filter(
            $this->videoRepository->listarCanaisEmAberto($usuario, $minimoVideos),
            fn (array $canal): bool => !isset($comRegra[$this->normalizador->normalizar($canal['canal'])]),
        ));
    }

    /**
     * @return array{0: list<array<string, mixed>>, 1: int}
     */
    private function listarDuplicatas(Usuario $usuario, FiltroRevisaoMusicaDTO $filtro): array
    {
        $pares = $this->sugerirDuplicatas->executar($usuario);
        $paginaPares = array_slice($pares, $filtro->deslocamento(), $filtro->porPagina);
        $uuids = [];
        foreach ($paginaPares as $par) {
            $uuids = [...$uuids, ...$par];
        }
        $uuidsUnicos = array_values(array_unique($uuids));
        $musicas = $this->musicaRepository->buscarPorUuids($uuidsUnicos);
        $videosPrincipais = $this->videoRepository->mapearVideoPrincipalPorMusica($usuario, $uuidsUnicos);
        $faixasSpotify = $this->resolverFaixasSpotify($usuario, $uuidsUnicos);

        $itens = [];
        foreach ($paginaPares as [$primeira, $segunda]) {
            if (!isset($musicas[$primeira], $musicas[$segunda])) {
                continue;
            }
            $itens[] = ['musicas' => [
                $this->serializarLadoDuplicata($musicas[$primeira], $videosPrincipais, $faixasSpotify),
                $this->serializarLadoDuplicata($musicas[$segunda], $videosPrincipais, $faixasSpotify),
            ]];
        }

        return [$itens, count($pares)];
    }

    /**
     * @param array<string, array{videoId: string, titulo: string, canal: string, urlCapa: string|null, reproducoes: int}> $videosPrincipais
     * @param array<string, array{urlSpotify: string|null, urlCapa: string|null, reproducoes: int}>                        $faixasSpotify
     *
     * @return array<string, mixed>
     */
    private function serializarLadoDuplicata(MusicaCatalogo $musica, array $videosPrincipais, array $faixasSpotify): array
    {
        $uuid = $musica->uuid()->toRfc4122();

        return [
            ...$this->serializer->serializarMusica($musica),
            'videoPrincipal' => $videosPrincipais[$uuid] ?? null,
            'spotify' => $faixasSpotify[$uuid] ?? null,
        ];
    }

    /**
     * @param list<string> $musicaUuids
     *
     * @return array<string, array{urlSpotify: string|null, urlCapa: string|null, reproducoes: int}>
     */
    private function resolverFaixasSpotify(Usuario $usuario, array $musicaUuids): array
    {
        $faixas = $this->reproducaoRepository->mapearFaixaSpotifyPorMusica($usuario, $musicaUuids);
        if ([] === $faixas) {
            return [];
        }

        $mapa = $this->enriquecerImagens->enriquecerEAgendar(
            usuario: $usuario,
            faixas: array_values(array_map(static fn (array $faixa): array => ['codigo' => $faixa['codigo'], 'nome' => $faixa['nome'], 'artista' => $faixa['artista']], $faixas)),
            artistas: [],
            prioridade: self::PRIORIDADE_IMAGENS,
        );

        $resultado = [];
        foreach ($faixas as $uuid => $faixa) {
            $chave = ImagemSpotify::gerarChaveFaixa($faixa['codigo'], $faixa['artista'], $faixa['nome']);
            $resultado[$uuid] = [
                'urlSpotify' => $mapa->obterUrlSpotify($chave, ImagemSpotify::gerarUrlSpotifyFaixa($faixa['codigo'], $faixa['artista'], $faixa['nome'])),
                'urlCapa' => $mapa->obterImagem($chave),
                'reproducoes' => $faixa['reproducoes'],
            ];
        }

        return $resultado;
    }
}
