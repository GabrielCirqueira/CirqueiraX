<?php

declare(strict_types=1);

namespace App\EventListener;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\RateLimiter\RateLimiterFactory;

#[AsEventListener(event: KernelEvents::REQUEST, priority: 10)]
final class IngestaoRateLimiterListener
{
    public function __construct(
        private readonly RateLimiterFactory $ingestaoLimiter,
    ) {
    }

    public function __invoke(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $path = $request->getPathInfo();

        if (!str_starts_with($path, '/api/v1/ingestao') && !str_starts_with($path, '/api/v1/midia/ingestao')) {
            return;
        }

        $identificador = $request->headers->get('X-Agent-Token')
        ?? $request->getClientIp()
        ?? 'anonimo';

        $limiter = $this->ingestaoLimiter->create($identificador);
        $limit = $limiter->consume(1);

        if (!$limit->isAccepted()) {
            $segundos = max(1, $limit->getRetryAfter()->getTimestamp() - time());

            $event->setResponse(
                new JsonResponse(
                    [
                        'success' => false,
                        'error' => 'Limite de requisições de ingestão excedido.',
                        'details' => [
                            'retry_after_seconds' => $segundos,
                        ],
                    ],
                    Response::HTTP_TOO_MANY_REQUESTS,
                    [
                        'Retry-After' => (string) $segundos,
                    ],
                ),
            );
        }
    }
}
