<?php

declare(strict_types=1);

namespace App\Exception\YoutubeMusic;

use DomainException;

final class YoutubeMusicException extends DomainException
{
    private const int CODIGO_CREDENCIAIS_INVALIDAS = 422;
    private const int CODIGO_SERVICO_INDISPONIVEL = 503;
    private const int CODIGO_RESPOSTA_INESPERADA = 502;
    private const int CODIGO_MUITAS_TENTATIVAS = 429;
    private const int CODIGO_NAO_CONECTADA = 404;

    public static function credenciaisInvalidas(): self
    {
        return new self('O YouTube Music recusou a sessão informada. Copie os cabeçalhos de novo com a conta logada no navegador.', self::CODIGO_CREDENCIAIS_INVALIDAS);
    }

    public static function servicoIndisponivel(): self
    {
        return new self('O YouTube Music não respondeu agora. A consulta será tentada de novo mais tarde.', self::CODIGO_SERVICO_INDISPONIVEL);
    }

    public static function respostaInesperada(): self
    {
        return new self('A resposta do YouTube Music veio num formato inesperado. A biblioteca pode precisar de atualização.', self::CODIGO_RESPOSTA_INESPERADA);
    }

    public static function cabecalhosSemCookie(): self
    {
        return new self('O texto colado não tem o cabeçalho "cookie". Copie os cabeçalhos de uma requisição "browse" do music.youtube.com com a conta logada.', self::CODIGO_CREDENCIAIS_INVALIDAS);
    }

    public static function cookieCortado(): self
    {
        return new self('O cookie colado está cortado (tem "…" no meio). No navegador, clique com o botão direito na requisição "browse" e use Copiar valor → Copiar cabeçalhos da requisição.', self::CODIGO_CREDENCIAIS_INVALIDAS);
    }

    public static function cookieSemSessaoLogada(): self
    {
        return new self('O cookie colado não é de uma sessão logada (falta o valor __Secure-3PAPISID). Entre na conta no music.youtube.com e copie de novo.', self::CODIGO_CREDENCIAIS_INVALIDAS);
    }

    public static function muitasTentativasDeConexao(): self
    {
        return new self('Muitas tentativas de conectar o YouTube Music. Aguarde um minuto e tente de novo.', self::CODIGO_MUITAS_TENTATIVAS);
    }

    public static function contaNaoConectada(): self
    {
        return new self('O YouTube Music não está conectado nesta conta.', self::CODIGO_NAO_CONECTADA);
    }

    public function isCredenciaisInvalidas(): bool
    {
        return self::CODIGO_CREDENCIAIS_INVALIDAS === $this->getCode();
    }

    public function isServicoIndisponivel(): bool
    {
        return self::CODIGO_SERVICO_INDISPONIVEL === $this->getCode();
    }
}
