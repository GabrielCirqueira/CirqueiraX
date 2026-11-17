<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\Usuario;
use App\Exception\Usuario\UsuarioException;
use App\Service\Usuario\ResolverPermissaoPorRotaService;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

#[AsEventListener(event: KernelEvents::REQUEST, priority: 0)]
final readonly class VerificarPermissaoPorRotaListener
{
    public function __construct(
        private TokenStorageInterface $tokenStorage,
        private ResolverPermissaoPorRotaService $resolverPermissao,
    ) {}

    public function __invoke(RequestEvent $evento): void
    {
        if (!$evento->isMainRequest()) {
            return;
        }

        $caminho = $evento->getRequest()->getPathInfo();
        if (!str_starts_with($caminho, '/api/')) {
            return;
        }

        $usuario = $this->tokenStorage->getToken()?->getUser();
        if (!$usuario instanceof Usuario) {
            return;
        }

        if (!$this->resolverPermissao->usuarioTemAcesso($usuario, $caminho)) {
            $exigidas = $this->resolverPermissao->funcionalidadesExigidas($caminho) ?? [];
            $descricao = isset($exigidas[0]) ? $exigidas[0]->descricao() : null;
            throw UsuarioException::permissaoNegada($descricao);
        }
    }
}
