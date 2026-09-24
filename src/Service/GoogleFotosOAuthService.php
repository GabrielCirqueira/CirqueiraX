<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\ContaGoogleFotos;
use App\Interface\CriptografiaInterface;
use App\Repository\ContaGoogleFotosRepository;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final readonly class GoogleFotosOAuthService
{
    private const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

    public function __construct(
        private HttpClientInterface $httpClient,
        private CriptografiaInterface $criptografia,
        private ContaGoogleFotosRepository $contaRepository,
        private string $clientId = '',
        private string $clientSecret = '',
    ) {
    }

    public function obterAccessTokenValido(ContaGoogleFotos $conta): string
    {
        if ($conta->accessTokenEstaValido()) {
            return (string) $conta->accessTokenCache();
        }

        $refreshToken = $this->criptografia->descriptografar($conta->refreshTokenCriptografado());

        $clientId = '' !== $this->clientId ? $this->clientId : ($_ENV['GOOGLE_CLIENT_ID'] ?? getenv('GOOGLE_CLIENT_ID') ?: '');
        $clientSecret = '' !== $this->clientSecret ? $this->clientSecret : ($_ENV['GOOGLE_CLIENT_SECRET'] ?? getenv('GOOGLE_CLIENT_SECRET') ?: '');

        $response = $this->httpClient->request('POST', self::GOOGLE_TOKEN_URL, [
            'body' => [
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'refresh_token' => $refreshToken,
                'grant_type' => 'refresh_token',
            ],
        ]);

        $dadosToken = $response->toArray();
        $accessToken = $dadosToken['access_token'] ?? null;
        $expiresIn = (int) ($dadosToken['expires_in'] ?? 3600);

        if (empty($accessToken) || !is_string($accessToken)) {
            throw new \DomainException('erro_renovar_token_google', 400);
        }

        $expiraEm = (new \DateTimeImmutable())->modify(sprintf('+%d seconds', $expiresIn));

        $conta->setAccessTokenCache($accessToken, $expiraEm);
        $this->contaRepository->salvar($conta);

        return $accessToken;
    }
}
