<?php

declare(strict_types=1);

namespace App\Service\YoutubeData;

use App\Entity\VideoYoutube;
use App\Exception\YoutubeData\YoutubeDataException;
use App\Interface\YoutubeDataInterface;
use App\Repository\VideoYoutubeRepository;
use Psr\Log\LoggerInterface;

final readonly class AtualizarDetalhesVideosYoutubeService
{
    public function __construct(
        private YoutubeDataInterface $youtubeData,
        private ControleCotaYoutubeDataService $controleCota,
        private VideoYoutubeRepository $videoRepository,
        private LoggerInterface $logger,
    ) {
    }

    /**
     * @param list<VideoYoutube> $videos
     */
    public function executar(array $videos): int
    {
        $atualizados = 0;

        foreach (array_chunk($videos, YoutubeDataInterface::TAMANHO_LOTE) as $lote) {
            if ($this->controleCota->unidadesDisponiveis() < ControleCotaYoutubeDataService::CUSTO_CONSULTA_VIDEOS) {
                break;
            }

            try {
                $atualizados += $this->atualizarLote($lote);
            } catch (YoutubeDataException $erro) {
                $this->tratarErro($erro);

                break;
            }
        }

        $this->videoRepository->flush();

        return $atualizados;
    }

    /**
     * @param list<VideoYoutube> $lote
     */
    private function atualizarLote(array $lote): int
    {
        $resultado = $this->youtubeData->buscarVideos(array_map(static fn (VideoYoutube $video): string => $video->videoId(), $lote));
        $this->controleCota->registrarConsumo($resultado->chamadasRealizadas * ControleCotaYoutubeDataService::CUSTO_CONSULTA_VIDEOS);

        foreach ($lote as $video) {
            $dados = $resultado->videos[$video->videoId()] ?? null;
            if (null === $dados) {
                $video->marcarIndisponivel();

                continue;
            }

            $video->registrarDetalhesYoutube($dados->canalId, $dados->categoriaId, $dados->duracaoMs, $dados->descricao);
        }

        return count($lote);
    }

    private function tratarErro(YoutubeDataException $erro): void
    {
        if ($erro->isCotaExcedida()) {
            $this->controleCota->registrarCotaExcedida();
        }

        $this->logger->warning('Consulta à YouTube Data API interrompida.', ['codigo' => $erro->getCode()]);
    }
}
