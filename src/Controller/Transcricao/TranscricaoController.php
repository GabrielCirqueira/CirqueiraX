<?php

declare(strict_types=1);

namespace App\Controller\Transcricao;

use App\Controller\Common\DefaultController;
use App\DataObject\Transcricao\AtualizarTranscricaoDTO;
use App\DataObject\Transcricao\EnviarAudioTranscricaoDTO;
use App\DataObject\Transcricao\FiltroTranscricoesDTO;
use App\DataObject\Transcricao\ReprocessarTranscricaoDTO;
use App\Entity\Usuario;
use App\Serializer\TranscricaoSerializer;
use App\Service\Transcricao\ApagarTranscricaoService;
use App\Service\Transcricao\AtualizarTranscricaoService;
use App\Service\Transcricao\ConsultarTranscricoesService;
use App\Service\Transcricao\EnviarAudioTranscricaoService;
use App\Service\Transcricao\ReprocessarTranscricaoService;
use App\Service\Transcricao\SolicitarCorrecaoTranscricaoService;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/v1/transcricoes', name: 'api_transcricoes_')]
final class TranscricaoController extends DefaultController
{
    private const string NOME_ARQUIVO_ASCII_PADRAO = 'audio';

    public function __construct(
        private readonly ConsultarTranscricoesService $consultarTranscricoesService,
        private readonly EnviarAudioTranscricaoService $enviarAudioTranscricaoService,
        private readonly AtualizarTranscricaoService $atualizarTranscricaoService,
        private readonly ReprocessarTranscricaoService $reprocessarTranscricaoService,
        private readonly ApagarTranscricaoService $apagarTranscricaoService,
        private readonly SolicitarCorrecaoTranscricaoService $solicitarCorrecaoTranscricaoService,
        private readonly TranscricaoSerializer $transcricaoSerializer,
    ) {}

    #[Route('', name: 'listar', methods: ['GET'])]
    public function listar(
        #[CurrentUser] Usuario $usuario,
        #[MapQueryString] FiltroTranscricoesDTO $filtro = new FiltroTranscricoesDTO(),
    ): Response {
        $pagina = $this->consultarTranscricoesService->listarDoUsuario($usuario, $filtro);

        return $this->paginated(
            $this->transcricaoSerializer->normalizarLista($pagina->transcricoes()),
            $pagina->total(),
            $filtro->pagina(),
            $filtro->limite(),
        );
    }

    #[Route('/resumo', name: 'resumo', methods: ['GET'], priority: 10)]
    public function resumo(#[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->consultarTranscricoesService->resumirDoUsuario($usuario)->paraArray());
    }

    #[Route('', name: 'enviar', methods: ['POST'])]
    public function enviar(Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        $transcricao = $this->enviarAudioTranscricaoService->executar(
            EnviarAudioTranscricaoDTO::fromRequest($request),
            $usuario,
        );

        return $this->created($this->transcricaoSerializer->normalizarResumo($transcricao));
    }

    #[Route('/{uuid}', name: 'detalhar', methods: ['GET'])]
    public function detalhar(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        $transcricao = $this->consultarTranscricoesService->obterDoUsuario($uuid, $usuario);

        return $this->success($this->transcricaoSerializer->normalizarDetalhe($transcricao));
    }

    #[Route('/{uuid}', name: 'atualizar', methods: ['PATCH'])]
    public function atualizar(
        string $uuid,
        #[CurrentUser] Usuario $usuario,
        #[MapRequestPayload] AtualizarTranscricaoDTO $dto,
    ): Response {
        $transcricao = $this->atualizarTranscricaoService->executar($uuid, $dto, $usuario);

        return $this->success($this->transcricaoSerializer->normalizarResumo($transcricao));
    }

    #[Route('/{uuid}/reprocessar', name: 'reprocessar', methods: ['POST'])]
    public function reprocessar(
        string $uuid,
        #[CurrentUser] Usuario $usuario,
        #[MapRequestPayload] ReprocessarTranscricaoDTO $dto = new ReprocessarTranscricaoDTO(),
    ): Response {
        $transcricao = $this->reprocessarTranscricaoService->executar($uuid, $dto, $usuario);

        return $this->success($this->transcricaoSerializer->normalizarResumo($transcricao));
    }

    #[Route('/{uuid}/corrigir', name: 'corrigir', methods: ['POST'])]
    public function corrigir(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        $transcricao = $this->solicitarCorrecaoTranscricaoService->executar($uuid, $usuario);

        return $this->success($this->transcricaoSerializer->normalizarDetalhe($transcricao));
    }

    #[Route('/{uuid}', name: 'apagar', methods: ['DELETE'])]
    public function apagar(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        $this->apagarTranscricaoService->executar($uuid, $usuario);

        return $this->noContent();
    }

    #[Route('/{uuid}/audio', name: 'audio', methods: ['GET'])]
    public function audio(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        $arquivo = $this->consultarTranscricoesService->obterArquivoAudio($uuid, $usuario);

        $resposta = new BinaryFileResponse($arquivo->caminhoFisico());
        $resposta->setAutoEtag();
        $resposta->headers->set('Content-Type', $arquivo->mimeType());
        $resposta->setContentDisposition(
            ResponseHeaderBag::DISPOSITION_INLINE,
            $arquivo->nomeArquivo(),
            self::NOME_ARQUIVO_ASCII_PADRAO,
        );

        return $resposta;
    }
}
