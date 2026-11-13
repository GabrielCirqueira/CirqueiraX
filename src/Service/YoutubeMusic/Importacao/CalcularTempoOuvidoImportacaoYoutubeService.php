<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic\Importacao;

use App\Entity\ImportacaoYoutube;
use App\Enum\ResultadoEtapaImportacaoYoutube;
use App\Repository\ImportacaoYoutubeRepository;
use App\Repository\ReproducaoYoutubeRepository;
use App\Repository\VideoYoutubeRepository;
use App\Service\Musica\Projecao\ProjetarReproducoesYoutubeService;
use App\Service\YoutubeMusic\CalcularFatorFimDeSessaoYoutubeService;
use App\Service\YoutubeMusic\RecalcularTempoOuvidoYoutubeService;
use DateTimeImmutable;

final readonly class CalcularTempoOuvidoImportacaoYoutubeService
{
    private const int MESES_POR_RODADA = 6;
    private const string FORMATO_INICIO_MES = 'Y-m-01 00:00:00';
    private const string PROXIMO_MES = '+1 month';

    public function __construct(
        private ReproducaoYoutubeRepository $reproducaoRepository,
        private VideoYoutubeRepository $videoRepository,
        private ImportacaoYoutubeRepository $importacaoRepository,
        private RecalcularTempoOuvidoYoutubeService $recalcularTempo,
        private CalcularFatorFimDeSessaoYoutubeService $calcularFator,
        private GerarRelatorioImportacaoYoutubeService $gerarRelatorio,
        private ProjetarReproducoesYoutubeService $projetarYoutube,
    ) {
    }

    public function executar(ImportacaoYoutube $importacao): ResultadoEtapaImportacaoYoutube
    {
        $uuid = $importacao->uuid()->toRfc4122();
        $primeira = $importacao->primeiraReproducaoEm();
        $ultima = $importacao->ultimaReproducaoEm();

        if (null === $primeira || null === $ultima) {
            return $this->concluir($importacao);
        }

        $inicio = $importacao->tempoCalculadoAte() ?? new DateTimeImmutable($primeira->format(self::FORMATO_INICIO_MES));
        $fator = $this->calcularFator->executar($importacao->usuario());

        for ($mes = 0; $mes < self::MESES_POR_RODADA && $inicio <= $ultima; ++$mes) {
            $fim = $inicio->modify(self::PROXIMO_MES);
            $this->recalcularTempo->calcularIntervalo($importacao->usuario(), $inicio, $fim, $fator, true);
            $this->reproducaoRepository->flush();
            $this->reproducaoRepository->limparCache();
            $importacao = $this->importacaoRepository->buscarPorUuid($uuid) ?? $importacao;
            $importacao->registrarTempoCalculadoAte($fim);
            $this->importacaoRepository->salvar($importacao);
            $inicio = $fim;
        }

        if ($inicio <= $ultima) {
            return ResultadoEtapaImportacaoYoutube::Continuar;
        }

        return $this->concluir($importacao);
    }

    private function concluir(ImportacaoYoutube $importacao): ResultadoEtapaImportacaoYoutube
    {
        $this->videoRepository->liberarTodosReservados($importacao->usuario());
        $this->projetarYoutube->projetarTudo($importacao->usuario());
        $importacao->concluir($this->gerarRelatorio->executar($importacao));
        $this->importacaoRepository->salvar($importacao);

        return ResultadoEtapaImportacaoYoutube::Parar;
    }
}
