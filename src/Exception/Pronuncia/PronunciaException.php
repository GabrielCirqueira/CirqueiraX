<?php

declare(strict_types=1);

namespace App\Exception\Pronuncia;

final class PronunciaException extends \DomainException
{
    private const int CODIGO_NAO_ENCONTRADO = 404;
    private const int CODIGO_INVALIDO = 422;
    private const int CODIGO_CONFLITO = 409;
    private const int CODIGO_FALHA_INTERNA = 500;

    public static function textoVazio(): self
    {
        return new self('Digite uma palavra, frase ou texto para traduzir.', self::CODIGO_INVALIDO);
    }

    public static function textoMuitoLongo(int $limite): self
    {
        return new self(sprintf('O texto passou do limite de %d caracteres. Divida em partes menores.', $limite), self::CODIGO_INVALIDO);
    }

    public static function semPalavrasEmIngles(): self
    {
        return new self('Não encontrei nenhuma palavra em inglês para gerar a pronúncia.', self::CODIGO_INVALIDO);
    }

    public static function fraseNaoEncontrada(): self
    {
        return new self('A frase não foi encontrada.', self::CODIGO_NAO_ENCONTRADO);
    }

    public static function consultaNaoEncontrada(): self
    {
        return new self('Essa frase não está no seu histórico.', self::CODIGO_NAO_ENCONTRADO);
    }

    public static function relatoNaoEncontrado(): self
    {
        return new self('O relato de erro não foi encontrado.', self::CODIGO_NAO_ENCONTRADO);
    }

    public static function relatoJaResolvido(): self
    {
        return new self('Esse relato já foi resolvido.', self::CODIGO_CONFLITO);
    }

    public static function excecaoNaoEncontrada(): self
    {
        return new self('A correção de pronúncia não foi encontrada.', self::CODIGO_NAO_ENCONTRADO);
    }

    public static function pronunciaInvalida(string $palavra): self
    {
        return new self(sprintf('A pronúncia de "%s" está vazia ou tem caracteres inválidos. Use sílabas separadas por hífen e a tônica em maiúsculas, como "uél-KÂM".', $palavra), self::CODIGO_INVALIDO);
    }

    public static function palavraInvalida(): self
    {
        return new self('Informe uma única palavra em inglês, só com letras e apóstrofo.', self::CODIGO_INVALIDO);
    }

    public static function semProvedorDeIa(): self
    {
        return new self('Nenhuma IA está disponível agora para sugerir a correção. Tente de novo mais tarde ou corrija à mão.', self::CODIGO_CONFLITO);
    }

    public static function respostaIaInvalida(): self
    {
        return new self('A IA respondeu num formato que não deu para aproveitar. Tente de novo ou corrija à mão.', self::CODIGO_CONFLITO);
    }

    public static function dicionarioNaoEncontrado(string $caminho): self
    {
        return new self(sprintf('O arquivo do dicionário de pronúncia não foi encontrado em "%s".', $caminho), self::CODIGO_FALHA_INTERNA);
    }
}
