<?php

declare(strict_types=1);

namespace App\Controller\LivroAudio;

use App\Controller\Common\DefaultController;
use App\DataObject\ArquivoMidiaDTO;
use App\DataObject\SalvarPosicaoLivroDTO;
use App\DataObject\UploadLivroAudioDTO;
use App\Entity\Usuario;
use App\Serializer\LivroAudioSerializer;
use App\Service\LivroAudio\ApagarLivroAudioService;
use App\Service\LivroAudio\ConsultarLivrosAudioService;
use App\Service\LivroAudio\SalvarPosicaoLivroService;
use App\Service\LivroAudio\UploadLivroAudioService;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/v1/livros-audio', name: 'api_livros_audio_')]
final class LivroAudioController extends DefaultController
{
    private const string NOME_FALLBACK_PDF = 'livro.pdf';

    public function __construct(
        private readonly ConsultarLivrosAudioService $consultarLivrosAudioService,
        private readonly UploadLivroAudioService $uploadLivroAudioService,
        private readonly ApagarLivroAudioService $apagarLivroAudioService,
        private readonly SalvarPosicaoLivroService $salvarPosicaoLivroService,
        private readonly LivroAudioSerializer $livroAudioSerializer,
        private readonly RateLimiterFactory $marcadorPosicaoLimiter,
    ) {}

    #[Route('', name: 'listar', methods: ['GET'])]
    public function listar(#[CurrentUser] Usuario $usuario): Response
    {
        $livros = $this->consultarLivrosAudioService->listarDoUsuario($usuario);

        return $this->success($this->livroAudioSerializer->normalizarLista($livros));
    }

    #[Route('', name: 'upload', methods: ['POST'])]
    public function upload(Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        $dto = UploadLivroAudioDTO::fromRequest($request);
        $livro = $this->uploadLivroAudioService->executar($dto, $usuario);

        return $this->created($this->livroAudioSerializer->normalizar($livro));
    }

    #[Route('/{uuid}', name: 'detalhar', methods: ['GET'])]
    public function detalhar(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        $livro = $this->consultarLivrosAudioService->obterDoUsuario($uuid, $usuario);

        return $this->success($this->livroAudioSerializer->normalizar($livro));
    }

    #[Route('/{uuid}/posicao', name: 'salvar_posicao', methods: ['PUT'])]
    public function salvarPosicao(
        string $uuid,
        #[MapRequestPayload]
        SalvarPosicaoLivroDTO $dto,
        #[CurrentUser]
        Usuario $usuario,
    ): Response {
        $limiter = $this->marcadorPosicaoLimiter->create(sprintf('%s_%s', $usuario->getUserIdentifier(), $uuid));
        if (!$limiter->consume(1)->isAccepted()) {
            return $this->tooManyRequests('Limite de atualizações de posição excedido.');
        }

        $livro = $this->salvarPosicaoLivroService->executar($uuid, $dto, $usuario);

        return $this->success($this->livroAudioSerializer->normalizar($livro));
    }

    #[Route('/{uuid}', name: 'apagar', methods: ['DELETE'])]
    public function apagar(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        $this->apagarLivroAudioService->executar($uuid, $usuario);

        return $this->noContent();
    }

    #[Route('/{uuid}/pdf', name: 'servir_pdf', methods: ['GET'])]
    public function servirPdf(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        $arquivo = $this->consultarLivrosAudioService->obterArquivoPdf($uuid, $usuario);

        return $this->responderArquivo($arquivo, ResponseHeaderBag::DISPOSITION_INLINE);
    }

    private function responderArquivo(ArquivoMidiaDTO $arquivo, string $disposicao): Response
    {
        $resposta = new BinaryFileResponse($arquivo->caminhoFisico());
        $resposta->setAutoEtag();
        $resposta->headers->set('Content-Type', $arquivo->mimeType());
        $resposta->setContentDisposition($disposicao, $arquivo->nomeArquivo(), self::NOME_FALLBACK_PDF);

        return $resposta;
    }
}
