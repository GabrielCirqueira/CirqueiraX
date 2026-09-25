<?php

declare(strict_types=1);

namespace App\Infra\GoogleFotos;

use App\Exception\GoogleFotosAPIException;
use GuzzleHttp\Exception\RequestException;

final class GoogleFotosAPI extends GoogleFotosClient
{
    /**
     * @return array<string, mixed>
     */
    public function criarAlbum(string $accessToken, string $titulo): array
    {
        $customThrow = static fn (RequestException $e): \Throwable => new GoogleFotosAPIException(
            message: sprintf('Erro ao criar álbum no Google Fotos: %s', $e->getMessage()),
            code: (int) $e->getCode(),
            previous: $e,
        );

        /** @var array<string, mixed> $dados */
        $dados = $this->request(
            method: 'POST',
            uri: $this->resolverUrl('/v1/albums'),
            options: [
                'headers' => [
                    'Authorization' => 'Bearer '.$accessToken,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'album' => [
                        'title' => $titulo,
                    ],
                ],
            ],
            throw: $customThrow,
        );

        return $dados;
    }

    public function uploadBytes(string $accessToken, string $caminhoArquivo, string $mimeType): string
    {
        $stream = @fopen($caminhoArquivo, 'r');
        if (false === $stream) {
            throw new \DomainException('arquivo_origem_nao_encontrado', 404);
        }

        $customThrow = static fn (RequestException $e): \Throwable => new GoogleFotosAPIException(
            message: sprintf('Erro ao realizar upload de mídia para o Google Fotos: %s', $e->getMessage()),
            code: (int) $e->getCode(),
            previous: $e,
        );

        return $this->requestRaw(
            method: 'POST',
            uri: $this->resolverUrl('/v1/uploads'),
            options: [
                'headers' => [
                    'Authorization' => 'Bearer '.$accessToken,
                    'Content-Type' => 'application/octet-stream',
                    'X-Goog-Upload-Content-Type' => $mimeType,
                    'X-Goog-Upload-Protocol' => 'raw',
                ],
                'body' => $stream,
            ],
            throw: $customThrow,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function batchCreateMediaItems(string $accessToken, string $albumId, string $uploadToken, string $descricao): array
    {
        $customThrow = static fn (RequestException $e): \Throwable => new GoogleFotosAPIException(
            message: sprintf('Erro ao vincular mídia em lote no Google Fotos: %s', $e->getMessage()),
            code: (int) $e->getCode(),
            previous: $e,
        );

        /** @var array<string, mixed> $dados */
        $dados = $this->request(
            method: 'POST',
            uri: $this->resolverUrl('/v1/mediaItems:batchCreate'),
            options: [
                'headers' => [
                    'Authorization' => 'Bearer '.$accessToken,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'albumId' => $albumId,
                    'newMediaItems' => [
                        [
                            'description' => $descricao,
                            'simpleMediaItem' => [
                                'uploadToken' => $uploadToken,
                            ],
                        ],
                    ],
                ],
            ],
            throw: $customThrow,
        );

        return $dados;
    }
}
