<?php

declare(strict_types=1);

namespace App\Service\Ia;

use App\Entity\ConsumoIa;
use App\Entity\Usuario;
use App\Enum\FinalidadeConsumoIa;
use App\Repository\ConsumoIaRepository;

final readonly class RegistrarConsumoIaService
{
    private const int TOKENS_POR_MILHAO = 1000000;
    private const int MICRODOLARES_POR_DOLAR = 1000000;

    public function __construct(
        private ConsumoIaRepository $consumoRepository,
        private float $precoEntradaPorMilhao,
        private float $precoSaidaPorMilhao,
    ) {
    }

    public function executar(?Usuario $usuario, FinalidadeConsumoIa $finalidade, string $modelo, int $tokensEntrada, int $tokensSaida): ConsumoIa
    {
        $consumo = new ConsumoIa($usuario, $finalidade, $modelo, $tokensEntrada, $tokensSaida, $this->calcularCustoMicrodolares($tokensEntrada, $tokensSaida));
        $this->consumoRepository->salvar($consumo);

        return $consumo;
    }

    public function calcularCustoMicrodolares(int $tokensEntrada, int $tokensSaida): int
    {
        $dolares = ($tokensEntrada * $this->precoEntradaPorMilhao + $tokensSaida * $this->precoSaidaPorMilhao) / self::TOKENS_POR_MILHAO;

        return (int) round($dolares * self::MICRODOLARES_POR_DOLAR);
    }
}
