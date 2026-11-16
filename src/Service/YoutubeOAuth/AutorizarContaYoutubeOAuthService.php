<?php

declare(strict_types=1);

namespace App\Service\YoutubeOAuth;

use App\Entity\ContaYoutubeOAuth;
use App\Entity\Usuario;
use App\Exception\YoutubeOAuth\YoutubeOAuthException;
use App\Infra\GoogleOAuth\GoogleOAuthAPI;
use App\Interface\CriptografiaInterface;
use App\Interface\YoutubePlaylistInterface;
use App\Repository\ContaYoutubeOAuthRepository;
use DateTimeImmutable;
use Throwable;

final readonly class AutorizarContaYoutubeOAuthService
{
    private const string GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
    private const string SCOPES = 'https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/userinfo.email openid';
    private const string EMAIL_PADRAO = 'youtube_oauth@cirqueirax.local';

    public function __construct(
        private ContaYoutubeOAuthRepository $contaRepository,
        private CriptografiaInterface $criptografia,
        private GoogleOAuthAPI $googleOAuthApi,
        private YoutubePlaylistInterface $youtubePlaylist,
        private string $clientId,
        private string $clientSecret,
        private string $redirectUri,
    ) {
    }

    public function obterUrlAutorizacao(): string
    {
        if ('' === trim($this->clientId) || '' === trim($this->clientSecret)) {
            throw YoutubeOAuthException::credenciaisNaoConfiguradas();
        }

        return sprintf(
            '%s?client_id=%s&redirect_uri=%s&response_type=code&scope=%s&access_type=offline&prompt=%s',
            self::GOOGLE_AUTH_URL,
            urlencode($this->clientId),
            urlencode($this->redirectUri),
            urlencode(self::SCOPES),
            urlencode('consent select_account'),
        );
    }

    public function concluirAutorizacao(Usuario $usuario, string $entrada): ContaYoutubeOAuth
    {
        $code = $this->extrairCodigoAutorizacao($entrada);
        if (null === $code || '' === $code) {
            throw YoutubeOAuthException::codigoAutorizacaoAusente();
        }

        try {
            $dadosToken = $this->googleOAuthApi->trocarCodigoPorToken(
                $this->clientId,
                $this->clientSecret,
                $code,
                $this->redirectUri,
            );
        } catch (Throwable) {
            throw YoutubeOAuthException::falhaAoTrocarCodigoPorToken();
        }

        $refreshToken = $dadosToken['refresh_token'] ?? null;
        $accessToken = $dadosToken['access_token'] ?? null;
        $expiresIn = (int) ($dadosToken['expires_in'] ?? 3600);

        if (!is_string($refreshToken) || '' === trim($refreshToken)) {
            throw YoutubeOAuthException::refreshTokenAusente();
        }

        if (!is_string($accessToken) || '' === trim($accessToken)) {
            throw YoutubeOAuthException::falhaAoTrocarCodigoPorToken();
        }

        $email = $this->obterEmail($accessToken);
        $canal = $this->youtubePlaylist->obterCanalAutenticado($accessToken);
        $expiraEm = (new DateTimeImmutable())->modify(sprintf('+%d seconds', $expiresIn));
        $refreshTokenCriptografado = $this->criptografia->criptografar($refreshToken);

        $conta = $this->contaRepository->buscarDoUsuario($usuario);
        if (null === $conta) {
            $conta = new ContaYoutubeOAuth($usuario, $email, $refreshTokenCriptografado);
        }

        $conta->setRefreshTokenCriptografado($refreshTokenCriptografado);
        $conta->setEmail($email);
        $conta->setNomeCanal($canal->titulo);
        $conta->setCanalId($canal->canalId);
        $conta->setAccessTokenCache($accessToken, $expiraEm);
        $this->contaRepository->salvar($conta);

        return $conta;
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
                $descricaoErro = is_string($queryParams['error_description'] ?? null)
                    ? $queryParams['error_description']
                    : (string) $queryParams['error'];
                throw YoutubeOAuthException::autorizacaoRecusada($descricaoErro);
            }

            if (isset($queryParams['code']) && is_string($queryParams['code']) && '' !== trim($queryParams['code'])) {
                return trim($queryParams['code']);
            }
        }

        return $limpo;
    }

    private function obterEmail(string $accessToken): string
    {
        try {
            $userInfo = $this->googleOAuthApi->obterUserInfo($accessToken);
        } catch (Throwable) {
            return self::EMAIL_PADRAO;
        }

        $email = $userInfo['email'] ?? null;
        if (!is_string($email) || '' === trim($email)) {
            return self::EMAIL_PADRAO;
        }

        return trim($email);
    }
}
