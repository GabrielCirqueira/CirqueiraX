<?php

declare(strict_types=1);

namespace App\Exception\YoutubeData;

use DomainException;

final class YoutubeDataException extends DomainException
{
    private const int CODIGO_COTA_EXCEDIDA = 429;
    private const int CODIGO_CHAVE_INVALIDA = 401;
    private const int CODIGO_RESPOSTA_INESPERADA = 502;
    private const int CODIGO_SERVICO_INDISPONIVEL = 503;

    public static function cotaExcedida(): self
    {
        return new self('A cota diária da YouTube Data API acabou. O enriquecimento volta no próximo dia.', self::CODIGO_COTA_EXCEDIDA);
    }

    public static function chaveInvalida(): self
    {
        return new self('A chave da YouTube Data API está ausente ou foi recusada.', self::CODIGO_CHAVE_INVALIDA);
    }

    public static function respostaInesperada(): self
    {
        return new self('A YouTube Data API respondeu num formato inesperado.', self::CODIGO_RESPOSTA_INESPERADA);
    }

    public static function servicoIndisponivel(): self
    {
        return new self('A YouTube Data API não respondeu agora.', self::CODIGO_SERVICO_INDISPONIVEL);
    }

    public function isCotaExcedida(): bool
    {
        return self::CODIGO_COTA_EXCEDIDA === $this->getCode();
    }

    public function isChaveInvalida(): bool
    {
        return self::CODIGO_CHAVE_INVALIDA === $this->getCode();
    }
}
