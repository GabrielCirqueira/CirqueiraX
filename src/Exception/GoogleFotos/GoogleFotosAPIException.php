<?php

declare(strict_types=1);

namespace App\Exception\GoogleFotos;

use App\Exception\HTTP\ClienteHTTPException;

class GoogleFotosAPIException extends ClienteHTTPException
{
    public static function contaNaoEncontrada(): self
    {
        return new self('Nenhuma conta ativa do Google Fotos foi encontrada para realizar a integração.', 404);
    }

    public static function falhaUploadBytes(): self
    {
        return new self('Falha ao realizar o envio de bytes do arquivo para a API do Google Fotos.', 400);
    }

    public static function falhaRespostaLote(): self
    {
        return new self('Resposta inválida ou vazia recebida do envio em lote do Google Fotos.', 400);
    }

    public static function falhaBatchItem(string $mensagem): self
    {
        return new self(sprintf('O Google Fotos rejeitou o item enviado: %s', $mensagem), 400);
    }

    public static function mediaIdNaoRetornado(): self
    {
        return new self('O Google Fotos não retornou um ID válido para a mídia cadastrada.', 400);
    }

    public static function falhaCriarAlbum(string $nomeAlbum): self
    {
        return new self(sprintf('Ocorreu um erro ao criar o álbum "%s" no Google Fotos.', $nomeAlbum), 400);
    }
}
