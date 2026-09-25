<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\ContaGoogleFotos;
use App\Infra\GoogleOAuth\GoogleOAuthAPI;
use App\Interface\CriptografiaInterface;
use App\Repository\ContaGoogleFotosRepository;

final readonly class GoogleFotosOAuthService
{
    public function __construct(
        private GoogleOAuthAPI $googleOAuthApi,
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

        $dadosToken = $this->googleOAuthApi->renovarAccessToken($clientId, $clientSecret, $refreshToken);

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
