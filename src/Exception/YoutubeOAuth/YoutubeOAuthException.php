<?php

declare(strict_types=1);

namespace App\Exception\YoutubeOAuth;

use DomainException;

final class YoutubeOAuthException extends DomainException
{
    public static function credenciaisNaoConfiguradas(): self
    {
        return new self('As credenciais OAuth do YouTube não foram configuradas. Crie um cliente do tipo Aplicativo da Web no Google Cloud e preencha YOUTUBE_OAUTH_CLIENT_ID e YOUTUBE_OAUTH_CLIENT_SECRET.', 500);
    }

    public static function codigoAutorizacaoAusente(): self
    {
        return new self('Não foi possível identificar o código de autorização do YouTube OAuth.', 400);
    }

    public static function autorizacaoRecusada(string $motivo): self
    {
        return new self(sprintf('A autorização OAuth do YouTube foi recusada: %s.', $motivo), 400);
    }

    public static function refreshTokenAusente(): self
    {
        return new self('O Google não retornou um refresh token. Conceda novamente todas as permissões do YouTube.', 400);
    }

    public static function falhaAoTrocarCodigoPorToken(): self
    {
        return new self('Ocorreu uma falha ao trocar o código de autorização pelos tokens do YouTube OAuth.', 400);
    }

    public static function falhaAoRenovarAccessToken(): self
    {
        return new self('Ocorreu uma falha ao renovar o access token do YouTube OAuth.', 401);
    }

    public static function contaNaoConectada(): self
    {
        return new self('Nenhuma conta YouTube OAuth está conectada para este usuário.', 400);
    }

    public static function cotaExcedida(): self
    {
        return new self('A cota diária da API do YouTube foi excedida. Tente novamente mais tarde.', 429);
    }

    public static function tokenInvalidoOuExpirado(): self
    {
        return new self('O token de autenticação do YouTube OAuth é inválido ou expirou.', 401);
    }

    public static function respostaInesperada(): self
    {
        return new self('A resposta retornada pela API de playlists do YouTube possui um formato inválido ou inesperado.', 500);
    }

    public static function falhaServicoYoutube(): self
    {
        return new self('Os servidores do YouTube retornaram um erro temporário durante a solicitação.', 502);
    }
}
