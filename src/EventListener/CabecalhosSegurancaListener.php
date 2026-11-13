<?php

declare(strict_types=1);

namespace App\EventListener;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

#[AsEventListener(event: KernelEvents::RESPONSE, priority: -16)]
final class CabecalhosSegurancaListener
{
    private const array CABECALHOS = [
        'X-Content-Type-Options' => 'nosniff',
        'X-Frame-Options' => 'SAMEORIGIN',
        'Referrer-Policy' => 'same-origin',
        'Permissions-Policy' => 'camera=(), geolocation=(), payment=(), usb=()',
        'Cross-Origin-Opener-Policy' => 'same-origin',
    ];
    private const string CABECALHO_HSTS = 'Strict-Transport-Security';
    private const string VALOR_HSTS = 'max-age=31536000; includeSubDomains';

    public function __invoke(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $cabecalhos = $event->getResponse()->headers;

        foreach (self::CABECALHOS as $nome => $valor) {
            if (!$cabecalhos->has($nome)) {
                $cabecalhos->set($nome, $valor);
            }
        }

        if ($request->isSecure()) {
            $cabecalhos->set(self::CABECALHO_HSTS, self::VALOR_HSTS);
        }
    }
}
