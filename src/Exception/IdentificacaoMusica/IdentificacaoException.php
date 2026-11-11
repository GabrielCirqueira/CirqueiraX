<?php

declare(strict_types=1);

namespace App\Exception\IdentificacaoMusica;

use DomainException;

final class IdentificacaoException extends DomainException
{
    private const int CODIGO_RESPOSTA_INVALIDA = 502;
    private const int CODIGO_INDISPONIVEL = 503;
    private const int CODIGO_CHAVE_AUSENTE = 401;
    private const int CODIGO_LIMITE = 429;
    private const int CODIGO_PEDIDO_RECUSADO = 400;

    private int $tokensEntrada = 0;
    private int $tokensSaida = 0;
    private string $modelo = '';

    public static function respostaInvalida(string $modelo, int $tokensEntrada, int $tokensSaida): self
    {
        $excecao = new self('A IA devolveu uma identificação fora do formato esperado. Os vídeos vão para revisão.', self::CODIGO_RESPOSTA_INVALIDA);
        $excecao->modelo = $modelo;
        $excecao->tokensEntrada = $tokensEntrada;
        $excecao->tokensSaida = $tokensSaida;

        return $excecao;
    }

    public static function servicoIndisponivel(): self
    {
        return new self('A IA não respondeu agora. A identificação será tentada de novo.', self::CODIGO_INDISPONIVEL);
    }

    public static function chaveAusente(): self
    {
        return new self('A chave da OpenAI não está configurada.', self::CODIGO_CHAVE_AUSENTE);
    }

    public static function pedidoRecusado(int $codigoHttp): self
    {
        return new self(sprintf('A OpenAI recusou o pedido de identificação (HTTP %d). Confira o modelo e o nível de raciocínio configurados.', $codigoHttp), self::CODIGO_PEDIDO_RECUSADO);
    }

    public static function limiteDeRequisicoes(): self
    {
        return new self('A OpenAI limitou as requisições. A identificação será tentada de novo mais tarde.', self::CODIGO_LIMITE);
    }

    public function isRespostaInvalida(): bool
    {
        return self::CODIGO_RESPOSTA_INVALIDA === $this->getCode();
    }

    public function tokensEntrada(): int
    {
        return $this->tokensEntrada;
    }

    public function tokensSaida(): int
    {
        return $this->tokensSaida;
    }

    public function modelo(): string
    {
        return $this->modelo;
    }
}
