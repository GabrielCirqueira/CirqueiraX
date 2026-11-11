<?php

declare(strict_types=1);

namespace App\Exception\Musica;

use DomainException;

final class MusicaCatalogoException extends DomainException
{
    private const int CODIGO_NAO_ENCONTRADO = 404;
    private const int CODIGO_INVALIDO = 422;
    private const int CODIGO_CONFLITO = 409;

    public static function musicaNaoEncontrada(): self
    {
        return new self('Música não encontrada.', self::CODIGO_NAO_ENCONTRADO);
    }

    public static function videoNaoEncontrado(): self
    {
        return new self('Vídeo não encontrado.', self::CODIGO_NAO_ENCONTRADO);
    }

    public static function artistaNaoEncontrado(): self
    {
        return new self('Artista não encontrado.', self::CODIGO_NAO_ENCONTRADO);
    }

    public static function uniaoComElaMesma(): self
    {
        return new self('Escolha duas músicas diferentes para unir.', self::CODIGO_INVALIDO);
    }

    public static function uniaoCircular(): self
    {
        return new self('Essa união faria uma música apontar para ela mesma.', self::CODIGO_INVALIDO);
    }

    public static function tiposDiferentes(): self
    {
        return new self('Não dá para unir uma música com um mashup.', self::CODIGO_INVALIDO);
    }

    public static function musicaNaoUnida(): self
    {
        return new self('Essa música não está unida a outra.', self::CODIGO_INVALIDO);
    }

    public static function naoEhMashup(): self
    {
        return new self('Essa música não é um mashup.', self::CODIGO_INVALIDO);
    }

    public static function mashupJaExiste(): self
    {
        return new self('Já existe um mashup com essas músicas. Use a união para juntar os dois.', self::CODIGO_CONFLITO);
    }

    public static function dadosDaMusicaAusentes(): self
    {
        return new self('Informe uma música do catálogo ou o título e os artistas.', self::CODIGO_INVALIDO);
    }

    public static function separacaoSemAlvo(): self
    {
        return new self('Informe a música para desfazer a união ou o vídeo para separar.', self::CODIGO_INVALIDO);
    }

    public static function componentesDoMashupAusentes(): self
    {
        return new self('Informe pelo menos duas músicas para o mashup.', self::CODIGO_INVALIDO);
    }
}
