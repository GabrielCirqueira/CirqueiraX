<?php

declare(strict_types=1);

namespace App\Interface;

use App\DataObject\Ia\PedidoIaDTO;
use App\DataObject\Ia\RespostaIaDTO;
use App\Enum\ProvedorIa;
use App\Exception\Ia\ProvedorIaException;

interface ProvedorIaInterface
{
    public const string TAG = 'app.provedor_ia';

    public function provedor(): ProvedorIa;

    public function modelo(): string;

    public function isConfigurado(): bool;

    public function isGratuito(): bool;

    public function calcularCustoMicrodolares(int $tokensEntrada, int $tokensSaida): int;

    /**
     * @throws ProvedorIaException
     */
    public function completar(PedidoIaDTO $pedido): RespostaIaDTO;
}
