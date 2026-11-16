<?php

declare(strict_types=1);

namespace App\Service\YoutubeOAuth;

use App\Entity\ContaYoutubeOAuth;
use App\Exception\YoutubeOAuth\YoutubeOAuthException;
use App\Infra\GoogleOAuth\GoogleOAuthAPI;
use App\Interface\CriptografiaInterface;
use App\Repository\ContaYoutubeOAuthRepository;
use DateTimeImmutable;
use Throwable;

final readonly class ObterTokenValidoYoutubeOAuthService
{
    public function __construct(
        private ContaYoutubeOAuthRepository $contaRepository,
        private CriptografiaInterface $criptografia,
        private GoogleOAuthAPI $googleOAuthApi,
        private string $clientId,
        private string $clientSecret,
    ) {
    }

    public function executar(ContaYoutubeOAuth $conta): string
    {
        if ($conta->accessTokenEstaValido()) {
            return (string) $conta->accessTokenCache();
        }

        return $this->renovar($conta);
    }

    private function renovar(ContaYoutubeOAuth $conta): string
    {
        $refreshToken = $this->criptografia->descriptografar($conta->refreshTokenCriptografado());

        try {
            $dadosToken = $this->googleOAuthApi->renovarAccessToken($this->clientId, $this->clientSecret, $refreshToken);
        } catch (Throwable) {
            throw YoutubeOAuthException::falhaAoRenovarAccessToken();
        }

        $accessToken = $dadosToken['access_token'] ?? null;
        $expiresIn = (int) ($dadosToken['expires_in'] ?? 3600);
        if (!is_string($accessToken) || '' === trim($accessToken)) {
            throw YoutubeOAuthException::falhaAoRenovarAccessToken();
        }

        $expiraEm = (new DateTimeImmutable())->modify(sprintf('+%d seconds', $expiresIn));
        $conta->setAccessTokenCache($accessToken, $expiraEm);
        $this->contaRepository->salvar($conta);

        return $accessToken;
    }
}
