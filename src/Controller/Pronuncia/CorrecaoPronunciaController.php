<?php

declare(strict_types=1);

namespace App\Controller\Pronuncia;

use App\Controller\Common\DefaultController;
use App\DataObject\Pronuncia\AprovarRelatoPronunciaDTO;
use App\DataObject\Pronuncia\FiltroExcecoesPronunciaDTO;
use App\DataObject\Pronuncia\FiltroRelatosPronunciaDTO;
use App\DataObject\Pronuncia\SalvarExcecaoPronunciaDTO;
use App\Entity\Usuario;
use App\Enum\OrigemExcecaoPronuncia;
use App\Serializer\PronunciaSerializer;
use App\Service\Pronuncia\GerenciarExcecoesPronunciaService;
use App\Service\Pronuncia\RevisarRelatoPronunciaService;
use App\Service\Pronuncia\SugerirCorrecaoPronunciaService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/v1/pronuncia', name: 'api_pronuncia_correcao_')]
#[IsGranted('ROLE_ADMIN')]
final class CorrecaoPronunciaController extends DefaultController
{
    public function __construct(
        private readonly RevisarRelatoPronunciaService $revisarRelatoService,
        private readonly SugerirCorrecaoPronunciaService $sugerirCorrecaoService,
        private readonly GerenciarExcecoesPronunciaService $excecoesService,
        private readonly PronunciaSerializer $serializer,
    ) {
    }

    #[Route('/relatos', name: 'relatos', methods: ['GET'])]
    public function relatos(#[MapQueryString] FiltroRelatosPronunciaDTO $filtro = new FiltroRelatosPronunciaDTO()): Response
    {
        $relatos = $this->revisarRelatoService->listar($filtro->isSomenteEmAberto());

        return $this->success($this->serializer->serializarRelatos($relatos));
    }

    #[Route('/relatos/{uuid}/sugestao', name: 'sugerir', methods: ['POST'])]
    public function sugerir(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->serializer->serializarRelato($this->sugerirCorrecaoService->executar($usuario, $uuid)));
    }

    #[Route('/relatos/{uuid}/aprovar', name: 'aprovar', methods: ['POST'])]
    public function aprovar(string $uuid, #[MapRequestPayload] AprovarRelatoPronunciaDTO $dto = new AprovarRelatoPronunciaDTO()): Response
    {
        return $this->success($this->serializer->serializarRelato($this->revisarRelatoService->aprovar($uuid, $dto)));
    }

    #[Route('/relatos/{uuid}/rejeitar', name: 'rejeitar', methods: ['POST'])]
    public function rejeitar(string $uuid): Response
    {
        return $this->success($this->serializer->serializarRelato($this->revisarRelatoService->rejeitar($uuid)));
    }

    #[Route('/excecoes', name: 'excecoes', methods: ['GET'])]
    public function excecoes(#[MapQueryString] FiltroExcecoesPronunciaDTO $filtro = new FiltroExcecoesPronunciaDTO()): Response
    {
        return $this->success($this->serializer->serializarExcecoes($this->excecoesService->listar($filtro->busca())));
    }

    #[Route('/excecoes', name: 'salvar_excecao', methods: ['PUT'])]
    public function salvarExcecao(#[MapRequestPayload] SalvarExcecaoPronunciaDTO $dto): Response
    {
        $excecao = $this->excecoesService->salvar($dto->correcao(), $dto->observacao(), OrigemExcecaoPronuncia::Manual);

        return $this->success($this->serializer->serializarExcecao($excecao));
    }

    #[Route('/excecoes/{uuid}', name: 'apagar_excecao', methods: ['DELETE'])]
    public function apagarExcecao(string $uuid): Response
    {
        $this->excecoesService->apagar($uuid);

        return $this->noContent();
    }
}
