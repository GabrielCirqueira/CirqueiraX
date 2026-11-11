<?php

declare(strict_types=1);

namespace App\Service\Musica;

use App\DataObject\Musica\FiltroRevisaoMusicaDTO;
use App\Entity\Usuario;
use App\Entity\VideoYoutube;
use App\Enum\TipoRevisaoMusica;
use App\Repository\MusicaCatalogoRepository;
use App\Repository\RegraCanalYoutubeRepository;
use App\Repository\VideoYoutubeRepository;
use App\Serializer\MusicaCatalogoSerializer;

final readonly class ListarRevisaoMusicaService
{
    public function __construct(
        private VideoYoutubeRepository $videoRepository,
        private MusicaCatalogoRepository $musicaRepository,
        private RegraCanalYoutubeRepository $regraRepository,
        private SugerirDuplicatasCatalogoService $sugerirDuplicatas,
        private NormalizarTextoMusicaService $normalizador,
        private MusicaCatalogoSerializer $serializer,
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
     * @return array{0: list<array<string, mixed>>, 1: int}
     */
    private function listarVideos(Usuario $usuario, FiltroRevisaoMusicaDTO $filtro): array
    {
        $pagina = $this->videoRepository->listarParaRevisao($usuario, $filtro->tipo, $filtro->deslocamento(), $filtro->porPagina);
        $videos = $this->videoRepository->buscarPorUuidsOrdenados($usuario, $pagina['uuids']);

        return [array_map(fn (VideoYoutube $video): array => $this->serializer->serializarVideo($video), $videos), $pagina['total']];
    }

    /**
     * @return array{0: list<array<string, mixed>>, 1: int}
     */
    private function listarCanais(Usuario $usuario, FiltroRevisaoMusicaDTO $filtro): array
    {
        $comRegra = $this->regraRepository->listarCanaisComRegra($usuario);
        $canais = array_values(array_filter(
            $this->videoRepository->listarCanaisEmAberto($usuario),
            fn (array $canal): bool => !isset($comRegra[$this->normalizador->normalizar($canal['canal'])]),
        ));

        return [array_slice($canais, $filtro->deslocamento(), $filtro->porPagina), count($canais)];
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
        $musicas = $this->musicaRepository->buscarPorUuids($usuario, array_values(array_unique($uuids)));

        $itens = [];
        foreach ($paginaPares as [$primeira, $segunda]) {
            if (!isset($musicas[$primeira], $musicas[$segunda])) {
                continue;
            }
            $itens[] = ['musicas' => [$this->serializer->serializarMusica($musicas[$primeira]), $this->serializer->serializarMusica($musicas[$segunda])]];
        }

        return [$itens, count($pares)];
    }
}
