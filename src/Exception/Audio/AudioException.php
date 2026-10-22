<?php

declare(strict_types=1);

namespace App\Exception\Audio;

use DomainException;

class AudioException extends DomainException
{
    public static function audioNaoEncontrado(): self
    {
        return new self('O áudio informado não foi encontrado na sua conta.', 404);
    }

    public static function urlNaoSuportada(string $url): self
    {
        return new self(sprintf('O link "%s" não pertence a uma plataforma suportada (YouTube, Instagram, TikTok ou X).', $url), 422);
    }

    public static function arquivoDoAudioIndisponivel(): self
    {
        return new self('O arquivo MP3 não está mais disponível no servidor. Baixe novamente para gerar um novo arquivo.', 404);
    }

    public static function audioNaoPodeSerRebaixado(): self
    {
        return new self('Somente áudios expirados ou com erro podem ser baixados novamente.', 409);
    }

    public static function audioEmProcessamento(): self
    {
        return new self('O áudio ainda está sendo baixado. Aguarde terminar para removê-lo.', 409);
    }

    public static function downloadInterrompido(): self
    {
        return new self('O download foi interrompido antes de terminar. Baixe novamente para tentar outra vez.', 500);
    }
}
