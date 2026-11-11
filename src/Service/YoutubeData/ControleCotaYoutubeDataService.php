<?php

declare(strict_types=1);

namespace App\Service\YoutubeData;

use App\Repository\CotaYoutubeDataDiaRepository;
use DateTimeImmutable;
use DateTimeZone;

final readonly class ControleCotaYoutubeDataService
{
    public const int ORCAMENTO_DIARIO_UNIDADES = 5000;
    public const int CUSTO_CONSULTA_VIDEOS = 1;
    private const string FUSO_COTA = 'America/Los_Angeles';
    private const string FORMATO_DIA = 'Y-m-d';
    private const string FORMATO_MOMENTO = 'Y-m-d H:i:s';

    public function __construct(
        private CotaYoutubeDataDiaRepository $cotaRepository,
    ) {
    }

    public function unidadesDisponiveis(): int
    {
        $cota = $this->cotaRepository->obterDoDia($this->diaAtual());
        if ($cota['excedida']) {
            return 0;
        }

        return max(0, self::ORCAMENTO_DIARIO_UNIDADES - $cota['unidadesUsadas']);
    }

    public function registrarConsumo(int $unidades): void
    {
        if ($unidades <= 0) {
            return;
        }

        $this->cotaRepository->somarUnidades($this->diaAtual(), $unidades);
    }

    public function registrarCotaExcedida(): void
    {
        $this->cotaRepository->marcarExcedida($this->diaAtual(), (new DateTimeImmutable())->format(self::FORMATO_MOMENTO));
    }

    private function diaAtual(): string
    {
        return (new DateTimeImmutable('now', new DateTimeZone(self::FUSO_COTA)))->format(self::FORMATO_DIA);
    }
}
