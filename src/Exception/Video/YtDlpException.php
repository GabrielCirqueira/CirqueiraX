<?php

declare(strict_types=1);

namespace App\Exception\Video;

class YtDlpException extends \DomainException
{
    public static function falhaAoExtrairMetadataDoVideo(): self
    {
        return new self('Falha ao extrair os metadados do vídeo utilizando o yt-dlp.', 400);
    }

    public static function falhaAoProcessarJsonDeMetadata(): self
    {
        return new self('Não foi possível realizar o parse do JSON de metadados retornado pelo yt-dlp.', 500);
    }

    public static function falhaAoEfetuarDownloadDoVideo(): self
    {
        return new self('Ocorreu uma falha durante o download do vídeo pelo yt-dlp.', 500);
    }

    public static function arquivoDeVideoBaixadoNaoEncontrado(): self
    {
        return new self('O arquivo de vídeo baixado pelo yt-dlp não foi localizado no diretório de destino.', 500);
    }

    public static function urlInvalidaOuNaoSuportada(string $url): self
    {
        return new self(sprintf('A URL informada "%s" é inválida ou não pertence a uma plataforma suportada.', $url), 400);
    }
}
