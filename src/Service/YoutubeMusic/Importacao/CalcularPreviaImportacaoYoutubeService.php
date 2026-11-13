<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic\Importacao;

use App\Entity\ImportacaoYoutube;
use App\Enum\ResultadoEtapaImportacaoYoutube;
use App\Enum\StatusClassificacaoVideo;
use App\Repository\ImportacaoYoutubeRepository;
use App\Repository\VideoYoutubeRepository;
use App\Service\Ia\EstimarCustoIaService;

final readonly class CalcularPreviaImportacaoYoutubeService
{
    public const int LIMITE_CUSTO_AUTOMATICO_MICRODOLARES = 2000000;
    public const int TOKENS_ENTRADA_ESTIMADOS_POR_VIDEO = 300;
    public const int TOKENS_SAIDA_ESTIMADOS_POR_VIDEO = 170;
    private const string SUFIXO_CANAL_TOPIC = ' - Topic';

    public function __construct(
        private VideoYoutubeRepository $videoRepository,
        private ImportacaoYoutubeRepository $importacaoRepository,
        private EstimarCustoIaService $estimarCusto,
    ) {
    }

    public function executar(ImportacaoYoutube $importacao): ResultadoEtapaImportacaoYoutube
    {
        $usuario = $importacao->usuario();
        $pendentes = $this->videoRepository->contarReservadosPorStatus($usuario)[StatusClassificacaoVideo::Pendente->value] ?? 0;
        $semIa = $this->videoRepository->contarReservadosPendentesFaixaOficial($usuario, self::SUFIXO_CANAL_TOPIC);
        $paraIa = max(0, $pendentes - $semIa);
        $tokensEntrada = $paraIa * self::TOKENS_ENTRADA_ESTIMADOS_POR_VIDEO;
        $tokensSaida = $paraIa * self::TOKENS_SAIDA_ESTIMADOS_POR_VIDEO;
        $custo = $this->estimarCusto->estimarMicrodolares($tokensEntrada, $tokensSaida);

        $importacao->registrarPrevia($semIa, $paraIa, $tokensEntrada, $tokensSaida, $custo);

        if ($custo > self::LIMITE_CUSTO_AUTOMATICO_MICRODOLARES) {
            $importacao->aguardarConfirmacao();
            $this->importacaoRepository->salvar($importacao);

            return ResultadoEtapaImportacaoYoutube::Parar;
        }

        $importacao->iniciarClassificacao();
        $this->importacaoRepository->salvar($importacao);

        return ResultadoEtapaImportacaoYoutube::Continuar;
    }
}
