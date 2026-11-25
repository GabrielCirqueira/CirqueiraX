<?php

declare(strict_types=1);

namespace App\Exception\Pronuncia;

final class TraducaoException extends \DomainException
{
    private const int CODIGO_CHAVE = 401;
    private const int CODIGO_COTA = 429;
    private const int CODIGO_INDISPONIVEL = 503;
    private const int CODIGO_RESPOSTA = 502;

    public static function chaveAusente(): self
    {
        return new self('A tradução ainda não foi configurada: falta a chave do DeepL no servidor.', self::CODIGO_CHAVE);
    }

    public static function chaveRecusada(): self
    {
        return new self('O DeepL recusou a chave configurada. Confira a chave no painel do DeepL.', self::CODIGO_CHAVE);
    }

    public static function cotaEsgotada(): self
    {
        return new self('A cota de caracteres do DeepL acabou. Frases já traduzidas continuam funcionando pelo histórico.', self::CODIGO_COTA);
    }

    public static function muitasRequisicoes(): self
    {
        return new self('O DeepL pediu para esperar um pouco antes da próxima tradução. Tente de novo em alguns segundos.', self::CODIGO_COTA);
    }

    public static function servicoIndisponivel(): self
    {
        return new self('O serviço de tradução não respondeu agora. Tente de novo em instantes.', self::CODIGO_INDISPONIVEL);
    }

    public static function respostaInesperada(): self
    {
        return new self('O serviço de tradução respondeu num formato inesperado.', self::CODIGO_RESPOSTA);
    }
}
