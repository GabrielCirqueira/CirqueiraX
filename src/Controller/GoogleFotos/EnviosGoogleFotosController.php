<?php

declare(strict_types=1);

namespace App\Controller\GoogleFotos;

use App\Controller\Common\DefaultController;
use App\DataObject\FiltroEnviosGoogleFotosDTO;
use App\Serializer\RegistroEnvioGoogleFotosSerializer;
use App\Service\GoogleFotos\ListarEnviosGoogleFotosService;
use App\Service\GoogleFotos\ReenviarGoogleFotosService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/google-fotos/envios', name: 'api_google_fotos_envios_')]
final class EnviosGoogleFotosController extends DefaultController
{
    public function __construct(
        private readonly ListarEnviosGoogleFotosService $listarEnviosService,
        private readonly ReenviarGoogleFotosService $reenviarService,
        private readonly RegistroEnvioGoogleFotosSerializer $serializer,
    ) {}

    #[Route('', name: 'listar', methods: ['GET'])]
    public function listar(#[MapQueryString] ?FiltroEnviosGoogleFotosDTO $filtro = null): Response
    {
        $filtro ??= new FiltroEnviosGoogleFotosDTO();
        $pagina = $this->listarEnviosService->listar($filtro);

        return $this->paginated(
            $this->serializer->normalizarLista($pagina->registros()),
            $pagina->total(),
            $filtro->pagina(),
            $filtro->limite(),
        );
    }

    #[Route('/resumo', name: 'resumo', methods: ['GET'])]
    public function resumo(): Response
    {
        return $this->success($this->listarEnviosService->resumirUltimas24Horas());
    }

    #[Route('/{uuid}/reenviar', name: 'reenviar', methods: ['POST'])]
    public function reenviar(string $uuid): Response
    {
        $registro = $this->reenviarService->reenviar($uuid);

        return $this->success($this->serializer->normalizar($registro));
    }
}
