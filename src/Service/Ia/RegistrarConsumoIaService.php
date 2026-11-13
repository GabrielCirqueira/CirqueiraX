<?php

declare(strict_types=1);

namespace App\Service\Ia;

use App\DataObject\Ia\RespostaIaDTO;
use App\Entity\ConsumoIa;
use App\Entity\Usuario;
use App\Enum\FinalidadeConsumoIa;
use App\Repository\ConsumoIaRepository;

final readonly class RegistrarConsumoIaService
{
    public function __construct(
        private ConsumoIaRepository $consumoRepository,
    ) {
    }

    public function executar(?Usuario $usuario, FinalidadeConsumoIa $finalidade, RespostaIaDTO $resposta): ConsumoIa
    {
        $consumo = new ConsumoIa($usuario, $finalidade, $resposta->provedor, $resposta->modelo, $resposta->tokensEntrada, $resposta->tokensSaida, $resposta->custoMicrodolares);
        $this->consumoRepository->salvar($consumo);

        return $consumo;
    }
}
