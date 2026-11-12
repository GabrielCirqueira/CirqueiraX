<?php

declare(strict_types=1);

namespace App\Security;

use App\Repository\TokenExtensaoYoutubeMusicRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

final class TokenExtensaoYoutubeMusicAuthenticator extends AbstractAuthenticator
{
    public const string CABECALHO = 'X-Extensao-Token';
    public const string ROTA_EVENTOS = '/api/v1/youtube-music/extensao/eventos';
    private const string ALGORITMO_HASH = 'sha256';

    public function __construct(
        private readonly TokenExtensaoYoutubeMusicRepository $tokenRepository,
    ) {
    }

    public function supports(Request $request): ?bool
    {
        return self::ROTA_EVENTOS === $request->getPathInfo() && '' !== (string) $request->headers->get(self::CABECALHO);
    }

    public function authenticate(Request $request): Passport
    {
        $token = $this->tokenRepository->buscarAtivoPorHash(hash(self::ALGORITMO_HASH, (string) $request->headers->get(self::CABECALHO)));
        if (null === $token) {
            throw new CustomUserMessageAuthenticationException('Token da extensão inválido ou revogado. Gere um novo na página Música.');
        }

        return new SelfValidatingPassport(new UserBadge(
            $token->uuid()->toRfc4122(),
            static fn (): ExtensaoYoutubeMusicUser => new ExtensaoYoutubeMusicUser($token),
        ));
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new JsonResponse(['success' => false, 'error' => $exception->getMessageKey()], Response::HTTP_UNAUTHORIZED);
    }
}
