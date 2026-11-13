<?php

declare(strict_types=1);

namespace App\Exception\IdentificacaoMusica;

use App\DataObject\Ia\RespostaIaDTO;
use DomainException;

final class IdentificacaoException extends DomainException
{
    private const int CODIGO_RESPOSTA_INVALIDA = 502;
    private const int CODIGO_SEM_PROVEDOR = 503;

    private ?RespostaIaDTO $resposta = null;

    public static function respostaInvalida(RespostaIaDTO $resposta): self
    {
        $excecao = new self('A IA devolveu uma identificação fora do formato esperado. Os vídeos vão para revisão.', self::CODIGO_RESPOSTA_INVALIDA);
        $excecao->resposta = $resposta;

        return $excecao;
    }

    public static function semProvedorDisponivel(): self
    {
        return new self('Nenhum provedor de IA conseguiu identificar agora. A identificação será tentada de novo mais tarde.', self::CODIGO_SEM_PROVEDOR);
    }

    public function isRespostaInvalida(): bool
    {
        return self::CODIGO_RESPOSTA_INVALIDA === $this->getCode();
    }

    public function resposta(): ?RespostaIaDTO
    {
        return $this->resposta;
    }
}
