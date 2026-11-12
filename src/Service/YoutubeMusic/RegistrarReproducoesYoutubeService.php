<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic;

use App\DataObject\YoutubeMusic\ItemHistoricoYoutubeMusicDTO;
use App\Entity\ReproducaoYoutube;
use App\Entity\Usuario;
use App\Entity\VideoYoutube;
use App\Enum\FonteReproducaoYoutube;
use App\Repository\ReproducaoYoutubeRepository;
use App\Repository\VideoYoutubeRepository;
use App\Service\Musica\Projecao\ProjetarReproducoesYoutubeService;
use DateTimeImmutable;

final readonly class RegistrarReproducoesYoutubeService
{
    private const string FORMATO_SEGUNDOS_ATRAS = '-%d seconds';
    private const int MILISSEGUNDOS_POR_SEGUNDO = 1000;

    public function __construct(
        private VideoYoutubeRepository $videoRepository,
        private ReproducaoYoutubeRepository $reproducaoRepository,
        private EstimarTempoReproduzidoYoutubeService $estimarTempo,
        private ProjetarReproducoesYoutubeService $projetarYoutube,
    ) {
    }

    /**
     * @param list<ItemHistoricoYoutubeMusicDTO> $itensNovos
     */
    public function executar(Usuario $usuario, array $itensNovos, DateTimeImmutable $inicioDoMaisRecente): int
    {
        if ([] === $itensNovos) {
            return 0;
        }

        $videos = $this->obterVideos($usuario, $itensNovos);
        $reproducoes = $this->montarReproducoes($usuario, $itensNovos, $videos, $inicioDoMaisRecente);
        $existentes = array_flip($this->reproducaoRepository->buscarChavesExistentes(
            $usuario,
            array_map(static fn (ReproducaoYoutube $reproducao): string => $reproducao->chaveDeduplicacao(), $reproducoes),
        ));
        $novas = array_values(array_filter($reproducoes, static fn (ReproducaoYoutube $reproducao): bool => !isset($existentes[$reproducao->chaveDeduplicacao()])));

        $anterior = $this->encadearTempos($usuario, $novas);
        foreach ($novas as $reproducao) {
            $this->reproducaoRepository->salvar($reproducao, flush: false);
        }
        $this->reproducaoRepository->flush();
        $afetadas = null === $anterior ? $novas : [$anterior, ...$novas];
        $this->projetarYoutube->projetarVideos($usuario, array_map(static fn (ReproducaoYoutube $reproducao): VideoYoutube => $reproducao->video(), $afetadas));

        return count($novas);
    }

    /**
     * @param list<ItemHistoricoYoutubeMusicDTO> $itens
     *
     * @return array<string, VideoYoutube>
     */
    private function obterVideos(Usuario $usuario, array $itens): array
    {
        $videos = $this->videoRepository->buscarPorVideoIds($usuario, array_map(static fn (ItemHistoricoYoutubeMusicDTO $item): string => $item->videoId, $itens));

        foreach ($itens as $item) {
            $video = $videos[$item->videoId] ?? new VideoYoutube($usuario, $item->videoId, $item->titulo, $item->textoArtistas);
            $video->atualizarDadosColetados($item->titulo, $item->textoArtistas, $item->duracaoMs, $item->urlCapa, $item->tipoVideo);
            $this->videoRepository->salvar($video, flush: false);
            $videos[$item->videoId] = $video;
        }

        return $videos;
    }

    /**
     * @param list<ItemHistoricoYoutubeMusicDTO> $itens
     * @param array<string, VideoYoutube>         $videos
     *
     * @return list<ReproducaoYoutube>
     */
    private function montarReproducoes(Usuario $usuario, array $itens, array $videos, DateTimeImmutable $inicioDoMaisRecente): array
    {
        $reproducoes = [];
        $inicio = $inicioDoMaisRecente;

        foreach ($itens as $indice => $item) {
            if ($indice > 0) {
                $segundos = intdiv($item->duracaoMs ?? 0, self::MILISSEGUNDOS_POR_SEGUNDO);
                $inicio = $inicio->modify(sprintf(self::FORMATO_SEGUNDOS_ATRAS, $segundos));
            }

            $msReproduzidos = 0 === $indice ? 0 : $item->duracaoMs ?? 0;
            $reproducoes[] = new ReproducaoYoutube($usuario, $videos[$item->videoId], $inicio, $msReproduzidos, FonteReproducaoYoutube::Coletor);
        }

        return array_reverse($reproducoes);
    }

    /**
     * @param list<ReproducaoYoutube> $novasEmOrdemCronologica
     */
    private function encadearTempos(Usuario $usuario, array $novasEmOrdemCronologica): ?ReproducaoYoutube
    {
        if ([] === $novasEmOrdemCronologica) {
            return null;
        }

        $anterior = $this->reproducaoRepository->buscarUltimaAntesDe($usuario, $novasEmOrdemCronologica[0]->tocadaEm());
        $anteriorExistente = $anterior;
        foreach ($novasEmOrdemCronologica as $reproducao) {
            if (null !== $anterior) {
                $this->estimarTempo->executar($anterior, $reproducao);
            }
            $anterior = $reproducao;
        }

        return $anteriorExistente;
    }
}
