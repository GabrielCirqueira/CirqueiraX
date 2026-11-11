<?php

declare(strict_types=1);

namespace App\Exception\ImportacaoYoutube;

use DomainException;

final class ImportacaoYoutubeException extends DomainException
{
    private const int CODIGO_REQUISICAO_INVALIDA = 422;
    private const int CODIGO_NAO_ENCONTRADA = 404;
    private const int CODIGO_CONFLITO = 409;
    private const int CODIGO_ERRO_INTERNO = 500;
    private const int BYTES_POR_MEGABYTE = 1048576;

    public static function arquivoNaoEnviado(): self
    {
        return new self('Envie o arquivo do Google Takeout (ZIP ou JSON).', self::CODIGO_REQUISICAO_INVALIDA);
    }

    public static function tamanhoExcedido(int $limiteBytes): self
    {
        return new self(sprintf('O arquivo passa do limite de %d MB.', intdiv($limiteBytes, self::BYTES_POR_MEGABYTE)), self::CODIGO_REQUISICAO_INVALIDA);
    }

    public static function tipoNaoSuportado(): self
    {
        return new self('Formato não suportado. Envie o ZIP do Takeout ou o JSON do histórico de exibição.', self::CODIGO_REQUISICAO_INVALIDA);
    }

    public static function importacaoEmAndamento(): self
    {
        return new self('Já existe uma importação do YouTube em andamento nesta conta.', self::CODIGO_CONFLITO);
    }

    public static function importacaoNaoEncontrada(): self
    {
        return new self('Importação não encontrada.', self::CODIGO_NAO_ENCONTRADA);
    }

    public static function falhaAoArmazenar(): self
    {
        return new self('Não foi possível guardar o arquivo enviado.', self::CODIGO_ERRO_INTERNO);
    }

    public static function arquivoNaoEncontrado(): self
    {
        return new self('O arquivo da importação não está mais disponível.', self::CODIGO_ERRO_INTERNO);
    }

    public static function falhaAoAbrirZip(): self
    {
        return new self('Não foi possível abrir o ZIP enviado.', self::CODIGO_REQUISICAO_INVALIDA);
    }

    public static function historicoNaoEncontrado(): self
    {
        return new self('Nenhum histórico de exibição do YouTube em JSON foi encontrado no arquivo. No Takeout, escolha o formato JSON para o histórico.', self::CODIGO_REQUISICAO_INVALIDA);
    }
}
