<?php

declare(strict_types=1);

namespace App\Security;

use App\Repository\TokenAgenteRepository;
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

class TokenAgenteAuthenticator extends AbstractAuthenticator
{
    private const HEADER_NAME = 'X-Agent-Token';

    public function __construct(
        private readonly TokenAgenteRepository $tokenAgenteRepository,
    ) {
    }

    public function supports(Request $request): ?bool
    {
        return $request->headers->has(self::HEADER_NAME)
        && !empty($request->headers->get(self::HEADER_NAME));
    }

    public function authenticate(Request $request): Passport
    {
        $token = $request->headers->get(self::HEADER_NAME);

        if (empty($token)) {
            throw new CustomUserMessageAuthenticationException('Header X-Agent-Token ausente.');
        }

        $hash = hash('sha256', $token);
        $tokenAgente = $this->tokenAgenteRepository->buscarPorHash($hash);

        if (null === $tokenAgente || !$tokenAgente->ativo()) {
            throw new CustomUserMessageAuthenticationException('Token de agente inválido ou revogado.');
        }

        return new SelfValidatingPassport(
            new UserBadge(
                $tokenAgente->uuid()?->toString() ?? $tokenAgente->nome(),
                static fn (): AgenteUser => new AgenteUser($tokenAgente),
            ),
        );
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new JsonResponse(
            [
                'success' => false,
                'error' => $exception->getMessageKey(),
            ],
            Response::HTTP_UNAUTHORIZED,
        );
    }
}
