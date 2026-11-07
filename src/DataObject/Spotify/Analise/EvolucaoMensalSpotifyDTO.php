<?php

declare(strict_types=1);

namespace App\DataObject\Spotify\Analise;

final readonly class EvolucaoMensalSpotifyDTO
{
    /**
     * @param list<array{ano: int, mes: int, streams: int, minutos: int}> $meses
     */
    public function __construct(
        public array $meses,
        public int $ano,
        public int $mes,
        public int $diaAtual,
        public int $minutosMesAtual,
        public int $minutosMesAnteriorAteMesmoDia,
        public int $minutosMesmoMesAnoAnteriorAteMesmoDia,
        public int $minutosMesmoMesAnoAnterior,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'meses' => $this->meses,
            'comparacao' => [
                'ano' => $this->ano,
                'mes' => $this->mes,
                'diaAtual' => $this->diaAtual,
                'minutosMesAtual' => $this->minutosMesAtual,
                'minutosMesAnteriorAteMesmoDia' => $this->minutosMesAnteriorAteMesmoDia,
                'variacaoMesAnterior' => $this->variacao($this->minutosMesAnteriorAteMesmoDia),
                'minutosMesmoMesAnoAnteriorAteMesmoDia' => $this->minutosMesmoMesAnoAnteriorAteMesmoDia,
                'minutosMesmoMesAnoAnterior' => $this->minutosMesmoMesAnoAnterior,
                'variacaoAnoAnterior' => $this->variacao($this->minutosMesmoMesAnoAnteriorAteMesmoDia),
            ],
        ];
    }

    private function variacao(int $base): ?int
    {
        return $base > 0 ? (int) round((($this->minutosMesAtual - $base) / $base) * 100) : null;
    }
}
