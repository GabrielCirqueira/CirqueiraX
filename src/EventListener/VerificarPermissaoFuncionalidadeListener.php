<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\Usuario;
use App\Exception\Usuario\UsuarioException;
use App\Security\Attribute\RequerPermissao;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\ControllerArgumentsEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

#[AsEventListener(event: KernelEvents::CONTROLLER_ARGUMENTS)]
final readonly class VerificarPermissaoFuncionalidadeListener
{
    public function __construct(
        private TokenStorageInterface $tokenStorage,
    ) {}

    public function __invoke(ControllerArgumentsEvent $evento): void
    {
        /** @var list<RequerPermissao> $requerimentos */
        $requerimentos = $evento->getAttributes(RequerPermissao::class);
        if ([] === $requerimentos) {
            return;
        }

        $usuario = $this->tokenStorage->getToken()?->getUser();
        if (!$usuario instanceof Usuario) {
            throw UsuarioException::permissaoNegada();
        }

        foreach ($requerimentos as $requerimento) {
            if (!$usuario->possuiPermissao($requerimento->funcionalidade)) {
                throw UsuarioException::permissaoNegada($requerimento->funcionalidade->descricao());
            }
        }
    }
}
