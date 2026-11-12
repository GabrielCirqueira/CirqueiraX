<?php

declare(strict_types=1);

namespace App\Controller\Musica;

use App\Controller\Common\DefaultController;
use App\Service\Musica\Capa\ObterCapaMusicaService;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class CapaMusicaController extends DefaultController
{
    private const int CACHE_NAVEGADOR_SEGUNDOS = 2592000;

    public function __construct(
        private readonly ObterCapaMusicaService $obterCapaService,
    ) {}

    #[Route('/api/v1/musica/capa', name: 'api_musica_capa', methods: ['GET'])]
    public function obter(Request $request): Response
    {
        $capa = $this->obterCapaService->executar((string) $request->query->get('url', ''));

        $resposta = new BinaryFileResponse($capa->caminho);
        $resposta->headers->set('Content-Type', $capa->tipoConteudo);
        $resposta->setPublic();
        $resposta->setMaxAge(self::CACHE_NAVEGADOR_SEGUNDOS);
        $resposta->headers->addCacheControlDirective('immutable');

        return $resposta;
    }
}
