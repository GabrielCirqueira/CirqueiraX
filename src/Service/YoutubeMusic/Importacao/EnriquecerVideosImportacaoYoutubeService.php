<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic\Importacao;

use App\Entity\ImportacaoYoutube;
use App\Enum\EtapaImportacaoYoutube;
use App\Enum\ResultadoEtapaImportacaoYoutube;
use App\Repository\ImportacaoYoutubeRepository;
use App\Repository\VideoYoutubeRepository;
use App\Service\YoutubeData\AtualizarDetalhesVideosYoutubeService;
use App\Service\YoutubeData\ControleCotaYoutubeDataService;

final readonly class EnriquecerVideosImportacaoYoutubeService
{
    private const int LIMITE_POR_RODADA = 1000;

    public function __construct(
        private VideoYoutubeRepository $videoRepository,
        private ImportacaoYoutubeRepository $importacaoRepository,
        private AtualizarDetalhesVideosYoutubeService $atualizarDetalhes,
        private ControleCotaYoutubeDataService $controleCota,
    ) {
    }

    public function executar(ImportacaoYoutube $importacao): ResultadoEtapaImportacaoYoutube
    {
        $videos = $this->videoRepository->listarReservadosSemDetalhes($importacao->usuario(), self::LIMITE_POR_RODADA);

        if ([] === $videos) {
            $importacao->avancarPara(EtapaImportacaoYoutube::Filtro);
            $this->importacaoRepository->salvar($importacao);

            return ResultadoEtapaImportacaoYoutube::Continuar;
        }

        if ($this->controleCota->unidadesDisponiveis() < ControleCotaYoutubeDataService::CUSTO_CONSULTA_VIDEOS) {
            return ResultadoEtapaImportacaoYoutube::Aguardar;
        }

        $atualizados = $this->atualizarDetalhes->executar($videos);

        return 0 === $atualizados ? ResultadoEtapaImportacaoYoutube::Aguardar : ResultadoEtapaImportacaoYoutube::Continuar;
    }
}
