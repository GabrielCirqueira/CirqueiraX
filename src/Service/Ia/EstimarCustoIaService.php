<?php

declare(strict_types=1);

namespace App\Service\Ia;

use App\Interface\ProvedorIaInterface;

final readonly class EstimarCustoIaService
{
    public function __construct(
        private ListarProvedoresIaService $listarProvedores,
    ) {
    }

    /**
     * Pior caso entre os provedores que o pool pode usar: zero quando só os gratuitos estão liberados.
     */
    public function estimarMicrodolares(int $tokensEntrada, int $tokensSaida): int
    {
        $custos = array_map(
            static fn (ProvedorIaInterface $provedor): int => $provedor->calcularCustoMicrodolares($tokensEntrada, $tokensSaida),
            $this->listarProvedores->permitidos(),
        );

        return [] === $custos ? 0 : max($custos);
    }
}
