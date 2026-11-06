<?php

declare(strict_types=1);

namespace App\DataObject\Transcricao;

final readonly class ResumoTranscricoesDTO
{
    public function __construct(
        public int $total,
        public int $concluidas,
        public int $naFila,
        public int $transcrevendo,
        public int $comErro,
        public int $favoritas,
        public float $segundosTranscritos,
        public int $totalPalavras,
        public int $segundosRestantesEstimados,
    ) {}

    /**
     * @return array<string, int|float>
     */
    public function paraArray(): array
    {
        return [
            'total' => $this->total,
            'concluidas' => $this->concluidas,
            'naFila' => $this->naFila,
            'transcrevendo' => $this->transcrevendo,
            'comErro' => $this->comErro,
            'favoritas' => $this->favoritas,
            'segundosTranscritos' => round($this->segundosTranscritos, 1),
            'totalPalavras' => $this->totalPalavras,
            'segundosRestantesEstimados' => $this->segundosRestantesEstimados,
        ];
    }
}
