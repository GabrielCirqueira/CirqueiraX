<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic\Importacao;

use App\Entity\ImportacaoYoutube;
use App\Entity\ReproducaoYoutube;
use App\Enum\ResultadoEtapaImportacaoYoutube;
use App\Repository\ImportacaoYoutubeRepository;
use App\Repository\ReproducaoYoutubeRepository;
use App\Repository\VideoYoutubeRepository;
use App\Service\Musica\Projecao\ProjetarReproducoesYoutubeService;
use App\Service\YoutubeMusic\EstimarTempoReproduzidoYoutubeService;
use DateTimeImmutable;

final readonly class CalcularTempoOuvidoImportacaoYoutubeService
{
    private const int MESES_POR_RODADA = 6;
    private const string FORMATO_INICIO_MES = 'Y-m-01 00:00:00';
    private const string PROXIMO_MES = '+1 month';
    private const int MS_SEM_DURACAO = 0;

    public function __construct(
        private ReproducaoYoutubeRepository $reproducaoRepository,
        private VideoYoutubeRepository $videoRepository,
        private ImportacaoYoutubeRepository $importacaoRepository,
        private EstimarTempoReproduzidoYoutubeService $estimarTempo,
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

        for ($mes = 0; $mes < self::MESES_POR_RODADA && $inicio <= $ultima; ++$mes) {
            $fim = $inicio->modify(self::PROXIMO_MES);
            $this->calcularIntervalo($importacao, $inicio, $fim);
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

    private function calcularIntervalo(ImportacaoYoutube $importacao, DateTimeImmutable $inicio, DateTimeImmutable $fim): void
    {
        $usuario = $importacao->usuario();
        $reproducoes = $this->reproducaoRepository->listarNoIntervalo($usuario, $inicio, $fim);
        $seguinteForaDoMes = $this->reproducaoRepository->buscarPrimeiraAPartirDe($usuario, $fim);

        foreach ($reproducoes as $indice => $reproducao) {
            if (!$reproducao->fonte()->isTakeout()) {
                continue;
            }

            $seguinte = $reproducoes[$indice + 1] ?? $seguinteForaDoMes;
            $this->estimar($reproducao, $seguinte);
        }
    }

    private function estimar(ReproducaoYoutube $reproducao, ?ReproducaoYoutube $seguinte): void
    {
        if (null === $reproducao->video()->duracaoMs()) {
            $reproducao->ajustarMsReproduzidos(self::MS_SEM_DURACAO);

            return;
        }

        if (null === $seguinte) {
            $reproducao->ajustarMsReproduzidos($reproducao->video()->duracaoMs());

            return;
        }

        $this->estimarTempo->executar($reproducao, $seguinte);
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
