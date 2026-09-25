<?php

declare(strict_types=1);

namespace App\Infra\GoogleOAuth;

use App\Exception\GoogleFotosAPIException;
use GuzzleHttp\Exception\RequestException;

final class GoogleOAuthAPI extends GoogleOAuthClient
{
    /**
     * @return array<string, mixed>
     */
    public function renovarAccessToken(string $clientId, string $clientSecret, string $refreshToken): array
    {
        $customThrow = static fn(RequestException $e): \Throwable => new GoogleFotosAPIException(
            message: sprintf('Erro ao renovar token OAuth do Google: %s', $e->getMessage()),
            code: (int) $e->getCode(),
            previous: $e,
        );

        /** @var array<string, mixed> $dados */
        $dados = $this->request(
            method: 'POST',
            uri: $this->resolverUrl('/token'),
            options: [
                'form_params' => [
                    'client_id' => $clientId,
                    'client_secret' => $clientSecret,
                    'refresh_token' => $refreshToken,
                    'grant_type' => 'refresh_token',
                ],
            ],
            throw: $customThrow,
        );

        return $dados;
    }

    /**
     * @return array<string, mixed>
     */
    public function trocarCodigoPorToken(string $clientId, string $clientSecret, string $code, string $redirectUri): array
    {
        $customThrow = static fn(RequestException $e): \Throwable => new GoogleFotosAPIException(
            message: sprintf('Erro ao trocar código por token OAuth do Google: %s', $e->getMessage()),
            code: (int) $e->getCode(),
            previous: $e,
        );

        /** @var array<string, mixed> $dados */
        $dados = $this->request(
            method: 'POST',
            uri: $this->resolverUrl('/token'),
            options: [
                'form_params' => [
                    'client_id' => $clientId,
                    'client_secret' => $clientSecret,
                    'code' => $code,
                    'grant_type' => 'authorization_code',
                    'redirect_uri' => $redirectUri,
                ],
            ],
            throw: $customThrow,
        );

        return $dados;
    }

    /**
     * @return array<string, mixed>
     */
    public function obterUserInfo(string $accessToken): array
    {
        $customThrow = static fn(RequestException $e): \Throwable => new GoogleFotosAPIException(
            message: sprintf('Erro ao buscar dados de usuário do Google: %s', $e->getMessage()),
            code: (int) $e->getCode(),
            previous: $e,
        );

        /** @var array<string, mixed> $dados */
        $dados = $this->request(
            method: 'GET',
            uri: 'https://www.googleapis.com/oauth2/v2/userinfo',
            options: [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                ],
            ],
            throw: $customThrow,
        );

        return $dados;
    }
}
