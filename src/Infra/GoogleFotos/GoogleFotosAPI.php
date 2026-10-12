<?php

declare(strict_types=1);

namespace App\Infra\GoogleFotos;

use App\Exception\GoogleFotos\GoogleFotosAPIException;
use App\Exception\Storage\ArmazenamentoLocalException;
use GuzzleHttp\Exception\RequestException;

final class GoogleFotosAPI extends GoogleFotosClient
{
    /**
     * @return array<string, mixed>
     */
    public function criarAlbum(string $accessToken, string $titulo): array
    {
        return $this->executarComSemaforoERetry(function () use ($accessToken, $titulo) {
            $customThrow = static fn(RequestException $e): \Throwable => new GoogleFotosAPIException(
                message: sprintf('Erro ao criar álbum no Google Fotos: %s', $e->getMessage()),
                code: (int) $e->getCode(),
                previous: $e,
            );

            /** @var array<string, mixed> $dados */
            return $this->request(
                method: 'POST',
                uri: $this->resolverUrl('/v1/albums'),
                options: [
                    'headers' => [
                        'Authorization' => 'Bearer ' . $accessToken,
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
        });
    }

    public function uploadBytes(string $accessToken, string $caminhoArquivo, string $mimeType): string
    {
        $stream = @fopen($caminhoArquivo, 'r');
        if (false === $stream) {
            throw ArmazenamentoLocalException::arquivoDeOrigemNaoEncontradoParaCopia();
        }

        $customThrow = static fn(RequestException $e): \Throwable => new GoogleFotosAPIException(
            message: sprintf('Erro ao realizar upload de mídia para o Google Fotos: %s', $e->getMessage()),
            code: (int) $e->getCode(),
            previous: $e,
        );

        return $this->requestRaw(
            method: 'POST',
            uri: $this->resolverUrl('/v1/uploads'),
            options: [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
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
        return $this->executarComSemaforoERetry(function () use ($accessToken, $albumId, $uploadToken, $descricao) {
            $customThrow = static fn(RequestException $e): \Throwable => new GoogleFotosAPIException(
                message: sprintf('Erro ao vincular mídia em lote no Google Fotos: %s', $e->getMessage()),
                code: (int) $e->getCode(),
                previous: $e,
            );

            /** @var array<string, mixed> $dados */
            return $this->request(
                method: 'POST',
                uri: $this->resolverUrl('/v1/mediaItems:batchCreate'),
                options: [
                    'headers' => [
                        'Authorization' => 'Bearer ' . $accessToken,
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
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function criarMediaItem(string $accessToken, string $uploadToken, string $albumId, string $descricao): array
    {
        return $this->batchCreateMediaItems($accessToken, $albumId, $uploadToken, $descricao);
    }

    /**
     * @param list<string> $mediaItemIds
     *
     * @return array<string, mixed>
     */
    public function adicionarItensAoAlbum(string $accessToken, string $albumId, array $mediaItemIds): array
    {
        return $this->executarComSemaforoERetry(function () use ($accessToken, $albumId, $mediaItemIds) {
            $customThrow = static fn(RequestException $e): \Throwable => new GoogleFotosAPIException(
                message: sprintf('Erro ao adicionar mídia ao álbum no Google Fotos: %s', $e->getMessage()),
                code: (int) $e->getCode(),
                previous: $e,
            );

            /** @var array<string, mixed> $dados */
            return $this->request(
                method: 'POST',
                uri: $this->resolverUrl(sprintf('/v1/albums/%s:batchAddMediaItems', $albumId)),
                options: [
                    'headers' => [
                        'Authorization' => 'Bearer ' . $accessToken,
                        'Content-Type' => 'application/json',
                    ],
                    'json' => [
                        'mediaItemIds' => array_values($mediaItemIds),
                    ],
                ],
                throw: $customThrow,
            );
        });
    }

    /**
     * @param list<string> $mediaItemIds
     *
     * @return array<string, mixed>
     */
    public function removerItensDoAlbum(string $accessToken, string $albumId, array $mediaItemIds): array
    {
        return $this->executarComSemaforoERetry(function () use ($accessToken, $albumId, $mediaItemIds) {
            $customThrow = static fn(RequestException $e): \Throwable => new GoogleFotosAPIException(
                message: sprintf('Erro ao remover mídia do álbum no Google Fotos: %s', $e->getMessage()),
                code: (int) $e->getCode(),
                previous: $e,
            );

            /** @var array<string, mixed> $dados */
            return $this->request(
                method: 'POST',
                uri: $this->resolverUrl(sprintf('/v1/albums/%s:batchRemoveMediaItems', $albumId)),
                options: [
                    'headers' => [
                        'Authorization' => 'Bearer ' . $accessToken,
                        'Content-Type' => 'application/json',
                    ],
                    'json' => [
                        'mediaItemIds' => array_values($mediaItemIds),
                    ],
                ],
                throw: $customThrow,
            );
        });
    }

    /**
     * Serializa operações de escrita e aplica backoff exponencial com jitter
     * para contornar a cota rigorosa de "concurrent write request" (HTTP 429) da Google Photos Library API.
     *
     * @template T
     * @param callable(): T $operacao
     * @return T
     */
    private function executarComSemaforoERetry(callable $operacao): mixed
    {
        $lockFile = sys_get_temp_dir() . '/cirqueirax_google_photos_write.lock';
        $fp = @fopen($lockFile, 'c+');
        if (false !== $fp) {
            @flock($fp, LOCK_EX);
        }

        try {
            $maxTentativas = 4;
            for ($tentativa = 1; $tentativa <= $maxTentativas; ++$tentativa) {
                try {
                    $resultado = $operacao();
                    // Pequeno respiro (300ms) entre escritas sequenciais
                    usleep(300_000);

                    return $resultado;
                } catch (\Throwable $e) {
                    $msg = $e->getMessage();
                    $code = (int) $e->getCode();
                    $eh429 = (429 === $code)
                        || str_contains($msg, '429')
                        || str_contains($msg, 'concurrent write request')
                        || str_contains($msg, 'RESOURCE_EXHAUSTED')
                        || str_contains($msg, 'Too Many Requests');

                    if ($eh429 && $tentativa < $maxTentativas) {
                        // Espera exponencial: 2s (+ 1s rand), 4s (+ 1-2s rand), etc.
                        $esperaSegundos = ($tentativa * 2) + random_int(1, 2);
                        sleep($esperaSegundos);
                        continue;
                    }

                    throw $e;
                }
            }

            throw new GoogleFotosAPIException('Número máximo de tentativas excedido para escrita no Google Fotos.');
        } finally {
            if (false !== $fp) {
                @flock($fp, LOCK_UN);
                @fclose($fp);
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function listarAlbuns(string $accessToken, ?string $pageToken = null, int $pageSize = 50): array
    {
        $customThrow = static fn(RequestException $e): \Throwable => new GoogleFotosAPIException(
            message: sprintf('Erro ao listar álbuns no Google Fotos: %s', $e->getMessage()),
            code: (int) $e->getCode(),
            previous: $e,
        );

        $query = [
            'pageSize' => $pageSize,
            'excludeNonAppCreatedData' => 'true',
        ];
        if (null !== $pageToken && '' !== trim($pageToken)) {
            $query['pageToken'] = $pageToken;
        }

        /** @var array<string, mixed> $dados */
        $dados = $this->request(
            method: 'GET',
            uri: $this->resolverUrl('/v1/albums'),
            options: [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                ],
                'query' => $query,
            ],
            throw: $customThrow,
        );

        return $dados;
    }
}
