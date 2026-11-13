<?php

declare(strict_types=1);

namespace App\Service\Ia;

use App\DataObject\Ia\PedidoIaDTO;
use App\DataObject\Ia\RespostaIaDTO;
use App\Domain\Ia\LeitorJsonRespostaIa;
use App\Exception\Ia\PoolIaException;
use App\Exception\Ia\ProvedorIaException;
use App\Interface\ProvedorIaInterface;
use Psr\Log\LoggerInterface;

final readonly class CompletarComPoolIaService
{
    public function __construct(
        private ListarProvedoresIaService $listarProvedores,
        private AtualizarEstadoProvedorIaService $estadoProvedores,
        private LeitorJsonRespostaIa $leitorJson,
        private LoggerInterface $logger,
    ) {
    }

    /**
     * Tenta os provedores na ordem de prioridade e devolve a primeira resposta válida.
     * Limite de uso, acesso negado e falhas seguidas pausam o provedor e o pedido segue para o próximo.
     *
     * @throws PoolIaException
     */
    public function executar(PedidoIaDTO $pedido): RespostaIaDTO
    {
        $disponiveis = array_filter(
            $this->listarProvedores->permitidos(),
            fn (ProvedorIaInterface $provedor): bool => $this->estadoProvedores->isDisponivel($provedor->provedor()),
        );

        if ([] === $disponiveis) {
            throw PoolIaException::nenhumProvedorDisponivel();
        }

        foreach ($disponiveis as $provedor) {
            $resposta = $this->tentar($provedor, $pedido);
            if (null !== $resposta) {
                return $resposta;
            }
        }

        throw PoolIaException::todosOsProvedoresFalharam();
    }

    private function tentar(ProvedorIaInterface $provedor, PedidoIaDTO $pedido): ?RespostaIaDTO
    {
        try {
            $resposta = $this->validarFormato($provedor->completar($pedido), $pedido);
        } catch (ProvedorIaException $erro) {
            $this->estadoProvedores->registrarFalha($erro);
            $this->logger->warning('Provedor de IA falhou; o pedido segue para o próximo do pool.', [
                'provedor' => $erro->provedor()->value,
                'codigo' => $erro->getCode(),
                'esperaSegundos' => $erro->esperaSegundos(),
            ]);

            return null;
        }

        $this->estadoProvedores->registrarSucesso($provedor->provedor());

        return $resposta;
    }

    private function validarFormato(RespostaIaDTO $resposta, PedidoIaDTO $pedido): RespostaIaDTO
    {
        if (null === $pedido->esquemaResposta) {
            return $resposta;
        }

        $json = $this->leitorJson->ler($resposta->texto, $pedido->esquemaResposta->camposObrigatorios());
        if (null === $json) {
            throw ProvedorIaException::respostaForaDoFormato($resposta->provedor);
        }

        return $resposta->comJson($json);
    }
}
