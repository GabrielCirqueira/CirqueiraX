<?php

declare(strict_types=1);

namespace App\Service\GoogleFotos;

use App\Entity\ContaGoogleFotos;
use App\Infra\GoogleOAuth\GoogleOAuthAPI;
use App\Interface\CriptografiaInterface;
use App\Repository\ContaGoogleFotosRepository;
use DateTimeImmutable;
use DomainException;
use Throwable;

final readonly class AutorizarContaGoogleFotosService
{
    private const string GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
    private const string SCOPES = 'https://www.googleapis.com/auth/photoslibrary.appendonly https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata https://www.googleapis.com/auth/photoslibrary.edit.appcreateddata https://www.googleapis.com/auth/photoslibrary.sharing https://www.googleapis.com/auth/photoslibrary https://www.googleapis.com/auth/userinfo.email openid';

    public function __construct(
        private GoogleOAuthAPI $googleOAuthApi,
        private CriptografiaInterface $criptografia,
        private ContaGoogleFotosRepository $contaRepository,
        private string $clientId,
        private string $clientSecret,
        private string $redirectUri = 'http://localhost',
    ) {}

    public function obterUrlAutorizacao(): string
    {
        return sprintf(
            '%s?client_id=%s&redirect_uri=%s&response_type=code&scope=%s&access_type=offline&prompt=consent',
            self::GOOGLE_AUTH_URL,
            urlencode($this->clientId),
            urlencode($this->redirectUri),
            urlencode(self::SCOPES),
        );
    }

    public function concluirAutorizacao(string $entrada, ?string $emailFornecido = null): ContaGoogleFotos
    {
        $code = $this->extrairCodigoAutorizacao($entrada);
        if (null === $code || '' === $code) {
            throw new DomainException('Não foi possível identificar o código de autorização.');
        }

        $dadosToken = $this->googleOAuthApi->trocarCodigoPorToken(
            $this->clientId,
            $this->clientSecret,
            $code,
            $this->redirectUri,
        );

        $refreshToken = $dadosToken['refresh_token'] ?? null;
        $accessToken = $dadosToken['access_token'] ?? null;
        $expiresIn = (int) ($dadosToken['expires_in'] ?? 3600);

        if (empty($refreshToken) || !is_string($refreshToken)) {
            throw new DomainException('O Google não retornou um refresh_token. Certifique-se de conceder todas as permissões.');
        }

        $email = $emailFornecido;
        if (empty($email) && !empty($accessToken) && is_string($accessToken)) {
            try {
                $userInfo = $this->googleOAuthApi->obterUserInfo($accessToken);
                $email = $userInfo['email'] ?? null;
            } catch (Throwable) {
                $email = null;
            }
        }

        if (empty($email)) {
            $email = 'google_fotos@cirqueirax.local';
        }

        $expiraEm = (new DateTimeImmutable())->modify(sprintf('+%d seconds', $expiresIn));
        $refreshTokenCriptografado = $this->criptografia->criptografar($refreshToken);

        $conta = $this->contaRepository->buscarPorEmail($email);
        if (null === $conta) {
            $conta = new ContaGoogleFotos($email, $refreshTokenCriptografado);
        } else {
            $conta->setRefreshTokenCriptografado($refreshTokenCriptografado);
        }

        $conta->setAccessTokenCache($accessToken, $expiraEm);
        $this->contaRepository->salvar($conta);

        return $conta;
    }

    public function desconectar(): void
    {
        $conta = $this->contaRepository->buscarContaAtiva();
        if (null !== $conta) {
            $this->contaRepository->remover($conta);
        }
    }

    public function extrairCodigoAutorizacao(string $entrada): ?string
    {
        $limpo = trim($entrada);
        if ('' === $limpo) {
            return null;
        }

        if (str_starts_with($limpo, 'http://') || str_starts_with($limpo, 'https://') || str_contains($limpo, '?') || str_contains($limpo, 'code=')) {
            $parsedUrl = parse_url($limpo);
            $queryString = $parsedUrl['query'] ?? (str_contains($limpo, '?') ? explode('?', $limpo, 2)[1] : $limpo);

            parse_str($queryString, $queryParams);

            if (isset($queryParams['error'])) {
                $descricaoErro = is_string($queryParams['error_description'] ?? null) ? $queryParams['error_description'] : (string) $queryParams['error'];
                throw new DomainException(sprintf('Google OAuth recusado: %s', $descricaoErro));
            }

            if (isset($queryParams['code']) && is_string($queryParams['code']) && '' !== trim($queryParams['code'])) {
                return trim((string) $queryParams['code']);
            }
        }

        return $limpo;
    }
}
