<?php

declare(strict_types=1);

namespace App\Exception\Ia;

use App\Enum\ProvedorIa;
use DomainException;

final class ProvedorIaException extends DomainException
{
    private const int CODIGO_LIMITE = 429;
    private const int CODIGO_ACESSO_NEGADO = 403;
    private const int CODIGO_PEDIDO_RECUSADO = 400;
    private const int CODIGO_INDISPONIVEL = 503;
    private const int CODIGO_RESPOSTA_INVALIDA = 502;

    private ProvedorIa $provedor;
    private ?int $esperaSegundos = null;

    private static function criar(ProvedorIa $provedor, string $mensagem, int $codigo): self
    {
        $excecao = new self($mensagem, $codigo);
        $excecao->provedor = $provedor;

        return $excecao;
    }

    public static function limiteAtingido(ProvedorIa $provedor, ?int $esperaSegundos): self
    {
        $excecao = self::criar($provedor, sprintf('O provedor %s atingiu o limite de uso gratuito e pediu uma pausa.', $provedor->nome()), self::CODIGO_LIMITE);
        $excecao->esperaSegundos = $esperaSegundos;

        return $excecao;
    }

    public static function acessoNegado(ProvedorIa $provedor, int $codigoHttp): self
    {
        return self::criar($provedor, sprintf('O provedor %s recusou o acesso (HTTP %d). Confira a chave, a conta ou o modelo configurado.', $provedor->nome(), $codigoHttp), self::CODIGO_ACESSO_NEGADO);
    }

    public static function pedidoRecusado(ProvedorIa $provedor, int $codigoHttp): self
    {
        return self::criar($provedor, sprintf('O provedor %s recusou o formato do pedido (HTTP %d).', $provedor->nome(), $codigoHttp), self::CODIGO_PEDIDO_RECUSADO);
    }

    public static function indisponivel(ProvedorIa $provedor): self
    {
        return self::criar($provedor, sprintf('O provedor %s não respondeu a tempo ou está fora do ar.', $provedor->nome()), self::CODIGO_INDISPONIVEL);
    }

    public static function respostaVazia(ProvedorIa $provedor): self
    {
        return self::criar($provedor, sprintf('O provedor %s devolveu uma resposta vazia.', $provedor->nome()), self::CODIGO_RESPOSTA_INVALIDA);
    }

    public static function respostaForaDoFormato(ProvedorIa $provedor): self
    {
        return self::criar($provedor, sprintf('O provedor %s devolveu uma resposta fora do formato pedido.', $provedor->nome()), self::CODIGO_RESPOSTA_INVALIDA);
    }

    public function provedor(): ProvedorIa
    {
        return $this->provedor;
    }

    public function esperaSegundos(): ?int
    {
        return $this->esperaSegundos;
    }

    public function isLimiteAtingido(): bool
    {
        return self::CODIGO_LIMITE === $this->getCode();
    }

    public function isAcessoNegado(): bool
    {
        return self::CODIGO_ACESSO_NEGADO === $this->getCode();
    }
}
