<?php

declare(strict_types=1);

namespace App\EventListener;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

#[AsEventListener(event: KernelEvents::REQUEST, priority: 512)]
final class RestringirTokenNaUrlListener
{
    private const string PARAMETRO_TOKEN = 'token';
    private const array METODOS_PERMITIDOS = [Request::METHOD_GET, Request::METHOD_HEAD];
    private const string PADRAO_ROTAS_DE_ARQUIVO = '#^/api/v1/(media-itens/[^/]+/(stream|thumbnail|download)|audios/[^/]+/(arquivo|stream)|transcricoes/[^/]+/audio)$#';

    public function __invoke(RequestEvent $event): void
    {
        $request = $event->getRequest();
        if (!$request->query->has(self::PARAMETRO_TOKEN)) {
            return;
        }

        $isMetodoPermitido = in_array($request->getMethod(), self::METODOS_PERMITIDOS, true);
        if ($isMetodoPermitido && 1 === preg_match(self::PADRAO_ROTAS_DE_ARQUIVO, $request->getPathInfo())) {
            return;
        }

        $request->query->remove(self::PARAMETRO_TOKEN);
    }
}
