<?php

declare(strict_types=1);

namespace App\Controller\Pronuncia;

use App\Controller\Common\DefaultController;
use App\DataObject\Pronuncia\FavoritarConsultaPronunciaDTO;
use App\DataObject\Pronuncia\FiltroHistoricoPronunciaDTO;
use App\DataObject\Pronuncia\PreviaPronunciaDTO;
use App\DataObject\Pronuncia\ReportarErroPronunciaDTO;
use App\DataObject\Pronuncia\TraduzirTextoDTO;
use App\Entity\Usuario;
use App\Serializer\PronunciaSerializer;
use App\Service\Pronuncia\ConsultarPainelPronunciaService;
use App\Service\Pronuncia\GerarAnalisePronunciaService;
use App\Service\Pronuncia\GerenciarHistoricoPronunciaService;
use App\Service\Pronuncia\ReportarErroPronunciaService;
use App\Service\Pronuncia\TraduzirTextoService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/v1/pronuncia', name: 'api_pronuncia_')]
final class PronunciaController extends DefaultController
{
    public function __construct(
        private readonly TraduzirTextoService $traduzirTextoService,
        private readonly GerarAnalisePronunciaService $gerarAnalisePronunciaService,
        private readonly GerenciarHistoricoPronunciaService $historicoService,
        private readonly ReportarErroPronunciaService $reportarErroService,
        private readonly ConsultarPainelPronunciaService $consultarPainelService,
        private readonly PronunciaSerializer $serializer,
    ) {
    }

    #[Route('/traducoes', name: 'traduzir', methods: ['POST'])]
    public function traduzir(#[CurrentUser] Usuario $usuario, #[MapRequestPayload] TraduzirTextoDTO $dto): Response
    {
        $consulta = $this->traduzirTextoService->executar($dto, $usuario);

        return $this->success($this->serializer->serializarConsulta($consulta));
    }

    #[Route('/previa', name: 'previa', methods: ['POST'])]
    public function previa(#[MapRequestPayload] PreviaPronunciaDTO $dto): Response
    {
        return $this->success($this->serializer->serializarAnalise($this->gerarAnalisePronunciaService->executar($dto->texto())));
    }

    #[Route('/painel', name: 'painel', methods: ['GET'])]
    public function painel(): Response
    {
        return $this->success($this->consultarPainelService->executar()->paraArray());
    }

    #[Route('/historico', name: 'historico', methods: ['GET'])]
    public function historico(
        #[CurrentUser] Usuario $usuario,
        #[MapQueryString] FiltroHistoricoPronunciaDTO $filtro = new FiltroHistoricoPronunciaDTO(),
    ): Response {
        $pagina = $this->historicoService->listar($usuario, $filtro);

        return $this->paginated($this->serializer->serializarHistorico($pagina->consultas), $pagina->total, $filtro->pagina(), $filtro->limite());
    }

    #[Route('/historico/{uuid}', name: 'detalhar', methods: ['GET'])]
    public function detalhar(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->serializer->serializarConsulta($this->historicoService->obter($usuario, $uuid)));
    }

    #[Route('/historico/{uuid}/favorita', name: 'favoritar', methods: ['PUT'])]
    public function favoritar(
        string $uuid,
        #[CurrentUser] Usuario $usuario,
        #[MapRequestPayload] FavoritarConsultaPronunciaDTO $dto,
    ): Response {
        $consulta = $this->historicoService->favoritar($usuario, $uuid, $dto->isFavorita());

        return $this->success($this->serializer->serializarConsulta($consulta));
    }

    #[Route('/historico/{uuid}', name: 'apagar', methods: ['DELETE'])]
    public function apagar(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        $this->historicoService->apagar($usuario, $uuid);

        return $this->noContent();
    }

    #[Route('/historico/{uuid}/relatos', name: 'reportar', methods: ['POST'])]
    public function reportar(
        string $uuid,
        #[CurrentUser] Usuario $usuario,
        #[MapRequestPayload] ReportarErroPronunciaDTO $dto,
    ): Response {
        $relato = $this->reportarErroService->executar($usuario, $uuid, $dto);

        return $this->created(['uuid' => $relato->uuid()->toRfc4122(), 'status' => $relato->status()->value]);
    }
}
