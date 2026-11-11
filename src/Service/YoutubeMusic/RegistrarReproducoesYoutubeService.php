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
use DateTimeImmutable;

final readonly class RegistrarReproducoesYoutubeService
{
    private const string FORMATO_SEGUNDOS_ATRAS = '-%d seconds';
    private const int MILISSEGUNDOS_POR_SEGUNDO = 1000;

    public function __construct(
        private VideoYoutubeRepository $videoRepository,
        private ReproducaoYoutubeRepository $reproducaoRepository,
        private EstimarTempoReproduzidoYoutubeService $estimarTempo,
    ) {
    }

    /**
     * @param list<ItemHistoricoYoutubeMusicDTO> $itensNovos
     */
    public function executar(Usuario $usuario, array $itensNovos, DateTimeImmutable $vistoEm): int
    {
        if ([] === $itensNovos) {
            return 0;
        }

        $videos = $this->obterVideos($usuario, $itensNovos);
        $reproducoes = $this->montarReproducoes($usuario, $itensNovos, $videos, $vistoEm);
        $existentes = array_flip($this->reproducaoRepository->buscarChavesExistentes(
            $usuario,
            array_map(static fn (ReproducaoYoutube $reproducao): string => $reproducao->chaveDeduplicacao(), $reproducoes),
        ));
        $novas = array_values(array_filter($reproducoes, static fn (ReproducaoYoutube $reproducao): bool => !isset($existentes[$reproducao->chaveDeduplicacao()])));

        $this->encadearTempos($usuario, $novas);
        foreach ($novas as $reproducao) {
            $this->reproducaoRepository->salvar($reproducao, flush: false);
        }
        $this->reproducaoRepository->flush();

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
            $video->atualizarDadosColetados($item->titulo, $item->textoArtistas, $item->duracaoMs, $item->urlCapa);
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
    private function montarReproducoes(Usuario $usuario, array $itens, array $videos, DateTimeImmutable $vistoEm): array
    {
        $reproducoes = [];
        $inicio = $vistoEm;

        foreach ($itens as $indice => $item) {
            if ($indice > 0) {
                $segundos = intdiv($item->duracaoMs ?? 0, self::MILISSEGUNDOS_POR_SEGUNDO);
                $inicio = $inicio->modify(sprintf(self::FORMATO_SEGUNDOS_ATRAS, $segundos));
            }

            $reproducoes[] = new ReproducaoYoutube($usuario, $videos[$item->videoId], $inicio, $item->duracaoMs ?? 0, FonteReproducaoYoutube::Coletor);
        }

        return array_reverse($reproducoes);
    }

    /**
     * @param list<ReproducaoYoutube> $novasEmOrdemCronologica
     */
    private function encadearTempos(Usuario $usuario, array $novasEmOrdemCronologica): void
    {
        if ([] === $novasEmOrdemCronologica) {
            return;
        }

        $anterior = $this->reproducaoRepository->buscarUltimaAntesDe($usuario, $novasEmOrdemCronologica[0]->tocadaEm());
        foreach ($novasEmOrdemCronologica as $reproducao) {
            if (null !== $anterior) {
                $this->estimarTempo->executar($anterior, $reproducao);
            }
            $anterior = $reproducao;
        }
    }
}
